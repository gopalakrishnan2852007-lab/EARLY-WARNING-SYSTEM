const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

/* ======================================================
   SENTINELALERT — PostgreSQL Database Config
====================================================== */

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'sentinelalert_db',

  // Connection pool settings
  max: 10,   // max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,

  // SSL for Render/production
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

/* ── Events ───────────────────────────────────────────── */
pool.on('connect', () => {
  console.log('🔗 SentinelAlert connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
  process.exit(-1);
});

/* ── Health Check ─────────────────────────────────────── */
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log(`✅ PostgreSQL healthy — Server time: ${result.rows[0].now}`);
    return true;
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
    return false;
  }
}

testConnection();

module.exports = pool;