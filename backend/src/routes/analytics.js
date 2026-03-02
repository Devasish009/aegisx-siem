const express = require('express');
const { pool } = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/overview
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    const [logins, failed, blocked, threats, activeThreats] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM login_logs WHERE timestamp > NOW() - INTERVAL '24 hours'"),
      pool.query("SELECT COUNT(*) FROM login_logs WHERE status = 'FAILED' AND timestamp > NOW() - INTERVAL '24 hours'"),
      pool.query('SELECT COUNT(*) FROM blocked_ips'),
      pool.query("SELECT COUNT(*) FROM threat_events WHERE timestamp > NOW() - INTERVAL '24 hours'"),
      pool.query("SELECT COUNT(*) FROM threat_events WHERE severity IN ('HIGH','CRITICAL') AND timestamp > NOW() - INTERVAL '1 hour'"),
    ]);

    const failedCount = parseInt(failed.rows[0].count);
    const totalCount = parseInt(logins.rows[0].count);
    const failRate = totalCount > 0 ? ((failedCount / totalCount) * 100).toFixed(1) : 0;

    let threatLevel = 'LOW';
    if (failRate > 30 || parseInt(activeThreats.rows[0].count) > 5) threatLevel = 'CRITICAL';
    else if (failRate > 20 || parseInt(activeThreats.rows[0].count) > 3) threatLevel = 'HIGH';
    else if (failRate > 10 || parseInt(activeThreats.rows[0].count) > 1) threatLevel = 'MEDIUM';

    res.json({
      success: true,
      data: {
        total_logins: parseInt(logins.rows[0].count),
        failed_attempts: failedCount,
        blocked_ips: parseInt(blocked.rows[0].count),
        threat_events: parseInt(threats.rows[0].count),
        active_threats: parseInt(activeThreats.rows[0].count),
        fail_rate: parseFloat(failRate),
        threat_level: threatLevel,
      },
    });
  } catch (err) {
    console.error('[Analytics] Overview error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/analytics/timeline  — hourly for last 24h
router.get('/timeline', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        DATE_TRUNC('hour', timestamp) AS hour,
        SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) AS success,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed
      FROM login_logs
      WHERE timestamp > NOW() - INTERVAL '24 hours'
      GROUP BY hour
      ORDER BY hour ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/analytics/severity  — threat severity distribution
router.get('/severity', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT severity, COUNT(*) as count
      FROM threat_events
      WHERE timestamp > NOW() - INTERVAL '7 days'
      GROUP BY severity
      ORDER BY CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/analytics/weekly  — daily threat count for last 7 days
router.get('/weekly', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        DATE_TRUNC('day', timestamp) AS day,
        COUNT(*) AS count
      FROM threat_events
      WHERE timestamp > NOW() - INTERVAL '7 days'
      GROUP BY day ORDER BY day ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/analytics/top-ips  — most active (suspicious) IPs
router.get('/top-ips', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ip_address, COUNT(*) AS attempts, MAX(risk_score) AS max_risk
      FROM login_logs
      WHERE status = 'FAILED' AND timestamp > NOW() - INTERVAL '24 hours'
      GROUP BY ip_address
      ORDER BY attempts DESC
      LIMIT 10
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
