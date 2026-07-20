require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { initDB } = require('./db');
const { setupSocket } = require('./socket');
const { ipBlockMiddleware } = require('./middleware/ipBlock');
const { payloadInspector } = require('./middleware/payloadInspector');

const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');
const logsRoutes = require('./routes/logs');
const blockedRoutes = require('./routes/blocked');
const usersRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);

// ─── Socket.io ───────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});
setupSocket(io);
app.set('io', io);

// ─── Security Middleware ──────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // disable for dev; configure in production
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 600000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = req.clientIP || req.ip;
    io.emit('threat_alert', {
      type: 'RATE_LIMIT_EXCEEDED',
      ip,
      severity: 'MEDIUM',
      message: `Rate limit exceeded from IP ${ip}`,
      timestamp: new Date().toISOString(),
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      code: 'RATE_LIMITED',
    });
  },
});

app.use(limiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Security Chain ───────────────────────────────────────────
app.use(ipBlockMiddleware);
app.use(payloadInspector);

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'operational', service: 'AegisX SIEM', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/blocked', blockedRoutes);
app.use('/api/users', usersRoutes);

// Serve static frontend assets in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

// ─── Error Handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await initDB();
    server.listen(PORT, () => {
      console.log(`\n🛡  AegisX SIEM Backend running on http://localhost:${PORT}`);
      console.log(`🔌  WebSocket ready`);
      console.log(`📋  Default admin: admin@aegisx.io / Admin@1234\n`);
    });
  } catch (err) {
    console.error('[Startup] Fatal error:', err.message);
    process.exit(1);
  }
};

start();
