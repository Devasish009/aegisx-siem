const express = require('express');
const { pool } = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/blocked  — list all blocked IPs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM blocked_ips ORDER BY blocked_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/blocked/block  — manually block an IP
router.post('/block', authMiddleware, adminMiddleware, async (req, res) => {
  const { ip_address, reason, severity } = req.body;
  if (!ip_address || !reason) {
    return res.status(400).json({ success: false, error: 'IP address and reason required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO blocked_ips (ip_address, reason, severity)
       VALUES ($1, $2, $3)
       ON CONFLICT (ip_address) DO UPDATE SET reason=$2, severity=$3, blocked_at=NOW()
       RETURNING *`,
      [ip_address, reason, severity || 'HIGH']
    );

    await pool.query(
      `INSERT INTO threat_events (event_type, severity, description, ip_address)
       VALUES ('MANUAL_BLOCK', $1, $2, $3)`,
      [severity || 'HIGH', `Admin manually blocked IP ${ip_address}. Reason: ${reason}`, ip_address]
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('threat_alert', {
        type: 'MANUAL_BLOCK',
        ip: ip_address,
        severity: severity || 'HIGH',
        message: `Admin blocked IP ${ip_address}: ${reason}`,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/blocked/unblock/:ip  — unblock an IP
router.post('/unblock/:ip', authMiddleware, adminMiddleware, async (req, res) => {
  const ip = decodeURIComponent(req.params.ip);

  try {
    const result = await pool.query(
      'DELETE FROM blocked_ips WHERE ip_address = $1 RETURNING *',
      [ip]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'IP not found in blocked list' });
    }

    await pool.query(
      `INSERT INTO threat_events (event_type, severity, description, ip_address)
       VALUES ('UNBLOCK', 'LOW', $1, $2)`,
      [`Admin unblocked IP ${ip}`, ip]
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('ip_unblocked', { ip, timestamp: new Date().toISOString() });
    }

    res.json({ success: true, message: `IP ${ip} unblocked successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
