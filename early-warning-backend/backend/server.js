const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config();

// IMPORTANT: These files MUST exist in your project folders, 
// otherwise you will get a new "Cannot find module" error.
const { connectRedis } = require('./src/config/redis');
const { startCronJobs } = require('./src/cron/jobs');
const pool = require('./src/config/db');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Root API
app.get("/", (req, res) => {
  res.json({
    status: "active",
    message: "🚀 AI Disaster Early Warning System Engine Running"
  });
});

// Locations API
app.get("/api/locations", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM Locations");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Latest environmental data
app.get("/api/latest-data", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT ON (location_id) *
      FROM EnvironmentalData
      ORDER BY location_id, timestamp DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Alerts API
app.get("/api/alerts", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM Alerts ORDER BY timestamp DESC LIMIT 50"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// WebSocket connection
io.on("connection", (socket) => {
  console.log("📡 Client connected:", socket.id);

  socket.emit("connection_established", {
    message: "Connected to Disaster Warning Server"
  });

  socket.on("disconnect", () => {
    console.log("⚠️ Client disconnected:", socket.id);
  });
});

// Start server safely
async function startServer() {
  try {
    // Redis connection (safe)
    try {
      await connectRedis();
      console.log("✅ Redis connected");
    } catch (err) {
      console.log("⚠️ Redis connection failed, continuing...");
    }

    // Start cron jobs
    try {
      startCronJobs();
      console.log("✅ Cron jobs started");
    } catch (err) {
      console.log("⚠️ Cron jobs failed to start");
    }

    global.io = io;

    const PORT = process.env.PORT || 10000;

    server.listen(PORT, () => {
      console.log(`🔥 Disaster Warning Engine running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Server failed to start:", error);
  }
}

startServer();