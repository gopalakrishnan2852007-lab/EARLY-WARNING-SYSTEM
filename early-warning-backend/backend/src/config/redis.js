const { createClient } = require('redis');
const dotenv = require('dotenv');

dotenv.config();

/* ======================================================
   SENTINELALERT — Redis Cache Config
   Used for: alert cooldowns, sensor cache, rate limiting
====================================================== */

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        console.error('❌ Redis max retries reached. Giving up.');
        return new Error('Redis max retries exceeded');
      }
      const delay = Math.min(retries * 500, 3000);
      console.log(`🔄 Redis reconnecting in ${delay}ms (attempt ${retries})...`);
      return delay;
    },
  },

  // Redis URL takes priority if set (Render Redis)
  ...(process.env.REDIS_URL ? { url: process.env.REDIS_URL } : {}),
});

/* ── Events ───────────────────────────────────────────── */
redisClient.on('error', (err) => console.error('❌ Redis Error:', err.message));
redisClient.on('connect', () => console.log('🟢 SentinelAlert connected to Redis'));
redisClient.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));
redisClient.on('ready', () => console.log('✅ Redis ready'));

/* ── Connect ──────────────────────────────────────────── */
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('❌ Redis connection failed:', err.message);
    console.warn('⚠️  SentinelAlert will run without Redis cache');
  }
};

/* ── Helper Utilities ─────────────────────────────────── */

// Cache sensor data (expires in 30s)
const cacheSensorData = async (locationId, data) => {
  try {
    await redisClient.setEx(
      `sentinel:sensor:${locationId}`,
      30,
      JSON.stringify(data)
    );
  } catch (err) {
    console.error('Redis cache write error:', err.message);
  }
};

// Get cached sensor data
const getCachedSensor = async (locationId) => {
  try {
    const data = await redisClient.get(`sentinel:sensor:${locationId}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
};

// Alert cooldown — prevent SMS spam (5 min TTL)
const setAlertCooldown = async (key = 'global') => {
  try {
    await redisClient.setEx(`sentinel:cooldown:${key}`, 300, '1');
  } catch (err) {
    console.error('Redis cooldown write error:', err.message);
  }
};

const checkAlertCooldown = async (key = 'global') => {
  try {
    const val = await redisClient.get(`sentinel:cooldown:${key}`);
    return val === '1'; // true = cooldown active
  } catch (err) {
    return false;
  }
};

// Is Redis alive?
const isRedisAlive = () => redisClient.isReady;

module.exports = {
  redisClient,
  connectRedis,
  cacheSensorData,
  getCachedSensor,
  setAlertCooldown,
  checkAlertCooldown,
  isRedisAlive,
};