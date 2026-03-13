const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");

dotenv.config();

// Safe imports
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
message: "AI Disaster Early Warning System Engine Running"
});
});

// Locations API
app.get("/api/locations", async (req, res) => {
try {
if (!pool) throw new Error("Database not connected");
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
if (!pool) throw new Error("Database not connected");

```
const { rows } = await pool.query(`
  SELECT DISTINCT ON (location_id) *
  FROM EnvironmentalData
  ORDER BY location_id, timestamp DESC
`);

res.json(rows);
```

} catch (err) {
console.error(err);
res.status(500).json({ error: err.message });
}
});

// Alerts API
app.get("/api/alerts", async (req, res) => {
try {
if (!pool) throw new Error("Database not connected");

```
const { rows } = await pool.query(
  "SELECT * FROM Alerts ORDER BY timestamp DESC LIMIT 50"
);

res.json(rows);
```

} catch (err) {
console.error(err);
res.status(500).json({ error: err.message });
}
});

// WebSocket connection
io.on("connection", (socket) => {
console.log("Client connected:", socket.id);

socket.emit("connection_established", {
message: "Connected to Disaster Warning Server"
});

socket.on("disconnect", () => {
console.log("Client disconnected:", socket.id);
});
});

// Start server
async function startServer() {
try {

```
// Redis
if (connectRedis && process.env.REDIS_URL) {
  try {
    await connectRedis();
    console.log("Redis connected");
  } catch (err) {
    console.log("Redis connection failed");
  }
} else {
  console.log("Redis skipped");
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

global.io = io;

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
```

} catch (error) {
console.error("Server failed to start:", error);
}
}

startServer();
