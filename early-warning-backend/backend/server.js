const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const axios = require("axios");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors({ origin: "*" }));
app.use(express.json());

/* ======================================================
   ENVIRONMENT VARIABLE CHECK
====================================================== */
const ALERT_PHONE = process.env.ALERT_PHONE_NUMBER;

if (ALERT_PHONE && !ALERT_PHONE.startsWith("+")) {
  console.warn("⚠️ WARNING: ALERT_PHONE_NUMBER does not start with '+'. Twilio requires E.164 format (e.g., +919876543210).");
}

/* ======================================================
   EMAIL ALERT ENGINE
====================================================== */

// Updated for Render deployment (Port 465 is required on Render)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ======================================================
   TWILIO SMS + CALL ALERT ENGINE
====================================================== */

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/* SMS ALERT */
async function sendSMSAlert() {
  try {
    await twilioClient.messages.create({
      body: "🚨 AquaGuardAI ALERT: High disaster risk detected!",
      from: process.env.TWILIO_PHONE_NUMBER,
      to: ALERT_PHONE
    });
    console.log("📱 SMS Sent Successfully");
    return { type: "SMS", success: true };
  } catch (error) {
    console.error("❌ SMS Error:", error.message);
    return { type: "SMS", success: false, error: error.message };
  }
}

/* PHONE CALL ALERT */
async function makePhoneCall() {
  try {
    await twilioClient.calls.create({
      twiml:
        "<Response><Say>Warning. High disaster risk detected by Aqua Guard AI. Please take precaution immediately.</Say></Response>",
      from: process.env.TWILIO_PHONE_NUMBER,
      to: ALERT_PHONE
    });
    console.log("📞 Phone Call Sent Successfully");
    return { type: "Call", success: true };
  } catch (error) {
    console.error("❌ Call Error:", error.message);
    return { type: "Call", success: false, error: error.message };
  }
}

/* EMAIL ALERT */
async function sendEmailAlert(data, riskLevel) {
  try {
    const mailOptions = {
      from: `"AquaGuard AI System" <${process.env.EMAIL_USER}>`,
      to: process.env.ALERT_EMAIL,
      subject: "🚨 AquaGuardAI Disaster Alert",
      html: `
      <h2>🚨 High Disaster Risk Detected</h2>
      <p><strong>Risk Level:</strong> <span style="color:red; text-transform:uppercase;">${riskLevel}</span></p>
      <ul>
        <li>Rainfall: ${data.rainfall} mm</li>
        <li>River Level: ${data.river_level} m</li>
        <li>Wind Speed: ${data.wind_speed} km/h</li>
        <li>Soil Moisture: ${data.soil_moisture}%</li>
      </ul>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("📧 Email Sent Successfully");
    return { type: "Email", success: true };
  } catch (error) {
    console.error("❌ Email Error:", error.message);
    return { type: "Email", success: false, error: error.message };
  }
}

/* ======================================================
   ALERT TRIGGER
====================================================== */

async function triggerAlerts(sensorData) {
  const risks = calculateRisks(sensorData);

  if (risks.risk_level === "high" || risks.risk_level === "critical") {
    console.log(`🚨 Triggering Alerts for Risk Level: ${risks.risk_level}`);

    // Wait for all alerts to process and collect their results
    const smsResult = await sendSMSAlert();
    const callResult = await makePhoneCall();
    const emailResult = await sendEmailAlert(sensorData, risks.risk_level);

    return [smsResult, callResult, emailResult];
  }
  
  return [{ message: "Risk level safe, no alerts triggered" }];
}

/* ======================================================
   TAMIL NADU LOCATIONS
====================================================== */

const TN_LOCATIONS = [
  { id: 1, name: "Chennai", latitude: 13.0827, longitude: 80.2707 },
  { id: 2, name: "Coimbatore", latitude: 11.0168, longitude: 76.9558 },
  { id: 3, name: "Madurai", latitude: 9.9252, longitude: 78.1198 },
  { id: 4, name: "Tiruchirappalli", latitude: 10.7905, longitude: 78.7047 },
  { id: 5, name: "Salem", latitude: 11.6643, longitude: 78.146 }
];

let liveSensorData = {};

TN_LOCATIONS.forEach((loc) => {
  liveSensorData[loc.id] = {
    location_id: loc.id,
    name: loc.name,
    latitude: loc.latitude,
    longitude: loc.longitude,
    rainfall: 0,
    temperature: 32,
    humidity: 60,
    wind_speed: 15,
    soil_moisture: 45,
    river_level: 1.5,
    timestamp: new Date()
  };
});

/* ======================================================
   WEATHER API
====================================================== */

async function fetchRealTNWeather() {
  try {
    const promises = TN_LOCATIONS.map(async (loc) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m`;

      const response = await axios.get(url);
      const current = response.data.current;

      liveSensorData[loc.id] = {
        ...liveSensorData[loc.id],
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        rainfall: current.precipitation,
        wind_speed: current.wind_speed_10m,
        timestamp: new Date()
      };
    });

    await Promise.all(promises);
    console.log("✅ Weather Updated");
  } catch (error) {
    console.error("⚠️ Weather API Error:", error.message);
  }
}

fetchRealTNWeather();
setInterval(fetchRealTNWeather, 5 * 60 * 1000);

/* ======================================================
   AI RISK ENGINE
====================================================== */

function calculateRisks(data) {
  const floodRisk = Math.min(
    (data.river_level / 8) * 0.6 + (data.rainfall / 50) * 0.4,
    1
  );

  const fireRisk =
    data.temperature > 30
      ? (data.temperature - 30) / 20 +
        (100 - data.humidity) / 100 +
        data.wind_speed / 100
      : 0;

  const maxRisk = Math.max(floodRisk, fireRisk);

  const risk_level =
    maxRisk > 0.75
      ? "critical"
      : maxRisk > 0.5
      ? "high"
      : maxRisk > 0.25
      ? "moderate"
      : "safe";

  return {
    risk_level,
    flood_probability: floodRisk,
    fire_probability: fireRisk
  };
}

/* ======================================================
   ROUTES
====================================================== */

app.get("/", (req, res) => {
  res.json({ status: "AquaGuard AI Backend Running" });
});

app.get("/api/latest-data", (req, res) => {
  res.json(Object.values(liveSensorData));
});

/* TEST ALERT ROUTE */
app.get("/simulate-risk", async (req, res) => {
  try {
    const simulatedData = {
      rainfall: 40,
      river_level: 6,
      wind_speed: 60,
      soil_moisture: 10,
      temperature: 38,
      humidity: 20
    };

    // Wait for the trigger function and capture results
    const results = await triggerAlerts(simulatedData);

    // Check if any of the alerts returned success: false
    const failures = results.filter(r => r.success === false);

    if (failures.length > 0) {
      // Send back exactly what failed so you can debug it
      res.status(500).json({
        message: "⚠️ Alerts executed, but some failed.",
        failed_alerts: failures,
        all_results: results
      });
    } else {
      res.status(200).json({
        message: "✅ All alerts triggered successfully!",
        details: results
      });
    }

  } catch (error) {
    res.status(500).json({ message: "Server error during simulation", error: error.message });
  }
});

/* ======================================================
   REALTIME SOCKET
====================================================== */

setInterval(() => {
  TN_LOCATIONS.forEach((loc) => {
    let current = liveSensorData[loc.id];

    current.temperature =
      Number(current.temperature) + (Math.random() * 0.2 - 0.1);

    io.emit("sensorUpdate", {
      location_id: loc.id,
      data: current
    });

    io.emit("riskUpdate", {
      location_id: loc.id,
      prediction: calculateRisks(current)
    });
  });
}, 3000);

io.on("connection", (socket) => {
  console.log("🟢 Frontend Connected:", socket.id);
});

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log(`🚀 AquaGuard AI Backend running on ${PORT}`);
});