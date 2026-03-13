const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Optional modules (safe loading)
let connectRedis = null;
let startCronJobs = null;
let pool = null;

try {
  connectRedis = require("./src/config/redis").connectRedis;
} catch (e) {
  console.log("Redis module not found, skipping");
}

try {
  startCronJobs = require("./src/cron/jobs").startCronJobs;
} catch (e) {
  console.log("Cron module not found, skipping");
}

try {
  pool = require("./src/config/db");
} catch (e) {
  console.log("Database module not found");
}

// Socket.io
const socketManager = require('./src/socket');
const io = socketManager.init(server);

// Middleware
app.use(cors());
app.use(express.json());

/* ------------------ ROUTES ------------------ */

// Root route
app.get("/", (req, res) => {
  res.json({
    status: "active",
    message: "AI Disaster Early Warning System Engine Running"
  });
});

// Locations
app.get("/api/locations", async (req, res) => {
  try {
    if (!pool) {
      throw new Error("Database not connected");
    }

    const result = await pool.query("SELECT * FROM Locations");

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Latest environmental data
app.get("/api/latest-data", async (req, res) => {
  try {
    if (!pool) {
      throw new Error("Database not connected");
    }

    const query = `
      SELECT DISTINCT ON (location_id) *
      FROM EnvironmentalData
      ORDER BY location_id, timestamp DESC
    `;

    const result = await pool.query(query);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Alerts
app.get("/api/alerts", async (req, res) => {
  try {
    if (!pool) {
      throw new Error("Database not connected");
    }

    const result = await pool.query(
      "SELECT * FROM Alerts ORDER BY timestamp DESC LIMIT 50"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// AI Chat Assistant
const { handleChatQuery } = require("./src/services/aiAssistantService");
app.post("/api/chat", async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const responseText = await handleChatQuery(message, context || "System is online. No immediate extreme threats detected.");
    res.json({ reply: responseText });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Community Reports
app.post("/api/reports", async (req, res) => {
  try {
    const { type, location, details } = req.body;

    // Save to DB
    if (pool) {
      await pool.query(
        "INSERT INTO CommunityReports (user_id, disaster_type, latitude, longitude) VALUES ($1, $2, $3, $4)",
        ['anonymous', type, 28.6139 + Math.random(), 77.2090 + Math.random()]
      );
    }

    // Broadcast to clients
    if (socketManager.getIO()) {
      socketManager.getIO().emit('new_alert', {
        severity: 'WARNING',
        message: `Community Report: ${type.toUpperCase()} sighted near ${location}. "${details}"`,
        timestamp: new Date()
      });
    }

    res.json({ success: true, message: "Report submitted successfully." });
  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ------------------ SOCKET ------------------ */

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.emit("connection_established", {
    message: "Connected to Disaster Warning Server"
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

/* ------------------ SERVER START ------------------ */

async function startServer() {
  try {
    // Redis connection
    if (connectRedis && process.env.REDIS_URL) {
      try {
        await connectRedis();
        console.log("Redis connected");
      } catch (err) {
        console.log("Redis connection failed");
      }
    }

    // Cron jobs
    if (startCronJobs) {
      try {
        startCronJobs();
        console.log("Cron jobs started");
      } catch (err) {
        console.log("Cron job start failed");
      }
    }

    const PORT = process.env.PORT || 10000;

    server.listen(PORT, () => {
      console.log("Server running on port " + PORT);
    });
  } catch (error) {
    console.error("Server failed to start:", error);
  }
}

startServer();