const { pool } = require('../db');

/**
 * Calculate risk score for a login attempt
 */
const calculateLoginRisk = async (ip, email, status, userAgent) => {
  let score = 0;
  const reasons = [];

  // +2 for every failed login
  if (status === 'FAILED') {
    score += 2;
    reasons.push('Failed login attempt (+2)');
  }

  // Check failed attempts in last 1 minute — +5 if >= 3
  const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
  const recentFails = await pool.query(
    `SELECT COUNT(*) FROM login_logs
     WHERE ip_address = $1 AND status = 'FAILED' AND timestamp > $2`,
    [ip, oneMinAgo]
  );

  if (parseInt(recentFails.rows[0].count) >= 3) {
    score += 5;
    reasons.push('3+ failed attempts in 1 min (+5)');
  }

  // Check brute force — 5 fails in 2 mins → CRITICAL (+20)
  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const bruteFails = await pool.query(
    `SELECT COUNT(*) FROM login_logs
     WHERE ip_address = $1 AND status = 'FAILED' AND timestamp > $2`,
    [ip, twoMinAgo]
  );

  if (parseInt(bruteFails.rows[0].count) >= 5) {
    score += 20;
    reasons.push('Brute force detected — 5+ fails in 2 min (+20)');
  }

  // Suspicious user-agent detection
  if (userAgent) {
    const suspiciousAgents = [
      'sqlmap',
      'nikto',
      'nmap',
      'masscan',
      'burpsuite',
      'hydra',
      'curl',
      'python-requests'
    ];

    const agentLower = userAgent.toLowerCase();
    if (suspiciousAgents.some(s => agentLower.includes(s))) {
      score += 10;
      reasons.push('Suspicious user-agent detected (+10)');
    }
  }

  // High frequency from same IP (> 20 requests in last 5 mins)
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const freqCheck = await pool.query(
    `SELECT COUNT(*) FROM login_logs WHERE ip_address = $1 AND timestamp > $2`,
    [ip, fiveMinAgo]
  );

  if (parseInt(freqCheck.rows[0].count) > 20) {
    score += 3;
    reasons.push('High request frequency (+3)');
  }

  return { score: Math.min(score, 100), reasons };
};


/**
 * Detect SQL/XSS injection in payload (Strict & Safe Version)
 */
const detectMaliciousPayload = (body) => {
  const payloadStr = JSON.stringify(body);

  // Strict SQL injection patterns only (no false positives)
  const sqlPatterns = [
    /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b/i,
    /\bOR\b\s+\d+\s*=\s*\d+/i,
    /--/,
    /\b(xp_|sp_)\w+/i
  ];

  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i
  ];

  if (sqlPatterns.some(p => p.test(payloadStr))) {
    return { detected: true, type: 'SQL_INJECTION', riskAdd: 15 };
  }

  if (xssPatterns.some(p => p.test(payloadStr))) {
    return { detected: true, type: 'XSS_ATTEMPT', riskAdd: 10 };
  }

  return { detected: false };
};


/**
 * Auto-block IP if risk threshold crossed
 */
const checkAndBlockIP = async (ip, riskScore, io) => {
  const threshold = parseInt(process.env.RISK_BLOCK_THRESHOLD) || 80;

  if (riskScore >= threshold) {

    const alreadyBlocked = await pool.query(
      'SELECT id FROM blocked_ips WHERE ip_address = $1',
      [ip]
    );

    if (alreadyBlocked.rows.length > 0) return false;

    await pool.query(
      `INSERT INTO blocked_ips (ip_address, reason, severity)
       VALUES ($1, $2, 'CRITICAL')
       ON CONFLICT (ip_address) DO NOTHING`,
      [ip, `Auto-blocked: Risk score ${riskScore}/100`]
    );

    await pool.query(
      `INSERT INTO threat_events (event_type, severity, description, ip_address)
       VALUES ('AUTO_BLOCK', 'CRITICAL', $1, $2)`,
      [`IP ${ip} automatically blocked — risk score: ${riskScore}`, ip]
    );

    if (io) {
      io.emit('threat_alert', {
        type: 'AUTO_BLOCK',
        ip,
        severity: 'CRITICAL',
        message: `IP ${ip} automatically blocked. Risk score: ${riskScore}/100`,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[SECURITY] IP ${ip} auto-blocked. Risk score: ${riskScore}`);
    return true;
  }

  return false;
};


/**
 * Brute force detection
 */
const checkBruteForce = async (ip, io) => {
  const windowMs = (parseInt(process.env.BRUTE_FORCE_WINDOW_MINUTES) || 2) * 60 * 1000;
  const threshold = parseInt(process.env.BRUTE_FORCE_THRESHOLD) || 5;
  const windowStart = new Date(Date.now() - windowMs).toISOString();

  const result = await pool.query(
    `SELECT COUNT(*) FROM login_logs
     WHERE ip_address = $1 AND status = 'FAILED' AND timestamp > $2`,
    [ip, windowStart]
  );

  const count = parseInt(result.rows[0].count);

  if (count >= threshold) {

    const recentThreat = await pool.query(
      `SELECT id FROM threat_events
       WHERE ip_address = $1 AND event_type = 'BRUTE_FORCE'
       AND timestamp > NOW() - INTERVAL '5 minutes'`,
      [ip]
    );

    if (recentThreat.rows.length === 0) {
      await pool.query(
        `INSERT INTO threat_events (event_type, severity, description, ip_address)
         VALUES ('BRUTE_FORCE', 'CRITICAL', $1, $2)`,
        [`Brute force attack: ${count} failed attempts from ${ip}`, ip]
      );

      if (io) {
        io.emit('threat_alert', {
          type: 'BRUTE_FORCE',
          ip,
          severity: 'CRITICAL',
          message: `Brute force detected from ${ip} — ${count} attempts`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return true;
  }

  return false;
};


module.exports = {
  calculateLoginRisk,
  detectMaliciousPayload,
  checkAndBlockIP,
  checkBruteForce
};