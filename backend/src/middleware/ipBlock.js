const { pool } = require('../db');

const ipBlockMiddleware = async (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0].trim();

  try {
    const result = await pool.query(
      'SELECT ip_address, reason, severity FROM blocked_ips WHERE ip_address = $1',
      [ip]
    );

    if (result.rows.length > 0) {
      const block = result.rows[0];

      // Log the blocked access attempt
      await pool.query(
        `INSERT INTO threat_events (event_type, severity, description, ip_address)
         VALUES ('BLOCKED_ACCESS', $1, $2, $3)`,
        [block.severity, `Blocked IP ${ip} attempted access to ${req.path}. Reason: ${block.reason}`, ip]
      );

      // Emit alert via socket if available
      const io = req.app.get('io');
      if (io) {
        io.emit('threat_alert', {
          type: 'BLOCKED_ACCESS',
          ip,
          severity: 'HIGH',
          message: `Blocked IP ${ip} attempted to access ${req.path}`,
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(403).json({
        success: false,
        error: 'Access denied. Your IP has been blocked due to suspicious activity.',
        code: 'IP_BLOCKED',
      });
    }

    req.clientIP = ip;
    next();
  } catch (err) {
    console.error('[IPBlock Middleware] Error:', err.message);
    req.clientIP = ip;
    next();
  }
};

module.exports = { ipBlockMiddleware };
