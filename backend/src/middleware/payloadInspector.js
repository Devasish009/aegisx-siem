const { detectMaliciousPayload } = require('../controllers/riskEngine');
const { pool } = require('../db');

const payloadInspector = async (req, res, next) => {
  if (req.body && Object.keys(req.body).length > 0) {
    const check = detectMaliciousPayload(req.body);

    if (check.detected) {
      const ip = req.clientIP || req.ip;
      const io = req.app.get('io');

      await pool.query(
        `INSERT INTO threat_events (event_type, severity, description, ip_address)
         VALUES ($1, 'HIGH', $2, $3)`,
        [check.type, `Malicious payload detected on ${req.path}: ${check.type}`, ip]
      ).catch(() => {});

      if (io) {
        io.emit('threat_alert', {
          type: check.type,
          ip,
          severity: 'HIGH',
          message: `${check.type} pattern detected in request to ${req.path}`,
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Malicious payload detected',
        code: check.type,
      });
    }
  }
  next();
};

module.exports = { payloadInspector };
