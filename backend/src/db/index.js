const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('[DB] PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error:', err);
});

const initDB = async () => {
  if (process.env.DATABASE_URL) {
    console.log('[DB] Connecting to database using DATABASE_URL...');
  } else {
    console.log(`[DB] Connecting to database using host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}...`);
  }
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        risk_score INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS login_logs (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        user_agent TEXT,
        status VARCHAR(10) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED')),
        risk_score INTEGER DEFAULT 0,
        timestamp TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS blocked_ips (
        id SERIAL PRIMARY KEY,
        ip_address VARCHAR(45) UNIQUE NOT NULL,
        reason VARCHAR(255) NOT NULL,
        severity VARCHAR(20) DEFAULT 'HIGH' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
        blocked_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS threat_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
        description TEXT NOT NULL,
        ip_address VARCHAR(45),
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);

    // Seed default admin user if not exists
    const bcrypt = require('bcrypt');
    const adminExists = await client.query("SELECT id FROM users WHERE email = 'admin@aegisx.io'");
    if (adminExists.rows.length === 0) {
      const hashed = await bcrypt.hash('Admin@1234', parseInt(process.env.BCRYPT_ROUNDS) || 12);
      await client.query(
        "INSERT INTO users (email, password, role) VALUES ($1, $2, 'admin')",
        ['admin@aegisx.io', hashed]
      );
      console.log('[DB] Default admin created: admin@aegisx.io / Admin@1234');
    }

    console.log('[DB] Schema initialized');
  } finally {
    client.release();
  }
};

module.exports = { pool, initDB };
