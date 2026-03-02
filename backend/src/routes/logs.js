const express = require('express');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { apiKeyAuth } = require('../middleware/apiKeyAuth');
const { 
  detectMaliciousPayload, 
  calculateLoginRisk, 
  checkBruteForce, 
  checkAndBlockIP 
} = require('../controllers/riskEngine');

const router = express.Router();


// =============================
// GET /api/logs/recent
// =============================
router.get('/recent', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT * FROM login_logs 
       ORDER BY timestamp DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM login_logs'
    );

    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      total,
      page,
      pages: Math.ceil(total / limit),
    });

  } catch (err) {
    console.error('[RECENT LOGS ERROR]', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// =============================
// GET /api/logs/threats
// =============================
router.get('/threats', authMiddleware, async (req, res) => {
  try {
    const severity = req.query.severity;
    let query = 'SELECT * FROM threat_events';
    const params = [];

    if (severity) {
      query += ' WHERE severity = $1';
      params.push(severity.toUpperCase());
    }

    query += ' ORDER BY timestamp DESC LIMIT 100';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error('[THREATS ERROR]', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// =============================
// 🔥 POST /api/logs/ingest
// External log ingestion API
// =============================
router.post('/ingest', apiKeyAuth, async (req, res) => {
  try {
    const { source, event_type, ip_address, user_email, user_agent, status } = req.body;

    if (!event_type || !ip_address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // 1️⃣ Insert login log
    await pool.query(
      `INSERT INTO login_logs (ip_address, email, status, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [
        ip_address,
        user_email || null,
        status || 'UNKNOWN',
        user_agent || null
      ]
    );

    // 2️⃣ Detect malicious payload
    const payloadCheck = detectMaliciousPayload(req.body);

    if (payloadCheck.detected) {
      await pool.query(
        `INSERT INTO threat_events (event_type, severity, description, ip_address)
         VALUES ($1, 'HIGH', $2, $3)`,
        [
          payloadCheck.type,
          `Malicious payload detected via ingest API`,
          ip_address
        ]
      );
    }

    // 3️⃣ Risk scoring
    const { score } = await calculateLoginRisk(
      ip_address,
      user_email,
      status,
      user_agent
    );

    const io = req.app.get('io');

    await checkBruteForce(ip_address, io);
    await checkAndBlockIP(ip_address, score, io);

    res.json({
      success: true,
      message: 'Log ingested successfully'
    });

  } catch (err) {
    console.error('[INGEST ERROR]', err.message);
    res.status(500).json({
      success: false,
      error: 'Ingestion failed'
    });
  }
});


module.exports = router;