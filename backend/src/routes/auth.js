const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { calculateLoginRisk, checkBruteForce, checkAndBlockIP } = require('../controllers/riskEngine');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const userRole = role === 'admin' ? 'admin' : 'user';

    const result = await pool.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
      [email, hashed, userRole]
    );

    const token = jwt.sign(
      { id: result.rows[0].id, email, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({ success: true, token, user: result.rows[0] });
  } catch (err) {
    console.error('[Auth] Register error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const ip = req.clientIP || req.ip;
  const userAgent = req.headers['user-agent'] || '';
  const io = req.app.get('io');

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    let status = 'FAILED';
    let loginRisk = 0;

    if (user && await bcrypt.compare(password, user.password)) {
      status = 'SUCCESS';
      const riskData = await calculateLoginRisk(ip, email, 'SUCCESS', userAgent);
      loginRisk = riskData.score;
    } else {
      const riskData = await calculateLoginRisk(ip, email, 'FAILED', userAgent);
      loginRisk = riskData.score;
    }

    // Log the attempt
    await pool.query(
      `INSERT INTO login_logs (user_email, ip_address, user_agent, status, risk_score)
       VALUES ($1, $2, $3, $4, $5)`,
      [email, ip, userAgent, status, loginRisk]
    );

    // Check brute force
    await checkBruteForce(ip, io);

    // Auto-block if risk too high
    await checkAndBlockIP(ip, loginRisk, io);

    if (status === 'FAILED') {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        riskScore: loginRisk,
      });
    }

    // Update user risk score
    await pool.query(
      'UPDATE users SET risk_score = GREATEST(0, risk_score + $1) WHERE id = $2',
      [loginRisk, user.id]
    );

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Emit successful login event
    if (io) {
      io.emit('login_event', {
        type: 'LOGIN_SUCCESS',
        ip,
        email: user.email,
        riskScore: loginRisk,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, role: user.role, risk_score: user.risk_score },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, role, risk_score, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
