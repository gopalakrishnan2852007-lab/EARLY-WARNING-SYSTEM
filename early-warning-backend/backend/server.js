const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const axios = require("axios");
const nodemailer = require("nodemailer"); // 🔥 Added Nodemailer
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

// ==========================================
// 📧 EMAIL ALERT ENGINE SETUP
// ==========================================
// IMPORTANT: You MUST use a "Gmail App Password", not your normal password.
// Generate one here: https://myaccount.google.com/apppasswords
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'earlywarning34@gmail.com', // Your Gmail
    pass: process.env.EMAIL_PASS || 'Gopal5417M'   // Put your 16-digit app password here or in .env
  }
});

// ==========================================
// 📱 SMS & VOICE CALLS SETUP (TWILIO)
// ==========================================
const twilioClient = process.env.AC7b7281124ca9e32869d62409f8b9320c && process.env.02f5746198692e75388c797a6ec2b9be
  ? twilio(process.env.AC7b7281124ca9e32869d62409f8b9320c, process.env.02f5746198692e75388c797a6ec2b9be)
  : null;

async function sendSMSAlert() {
  if (!twilioClient) {
    console.warn("⚠️ Twilio disconnected. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
    return;
  }
  try {
    await twilioClient.messages.create({
      body: "🚨 Disaster Alert: High risk detected by AquaGuardAI system.",
      from: process.env.7339448676,
      to: process.env.7339448676
    });
    console.log("🚨 SMS Sent successfully.");
  } catch (error) {
    console.error("SMS Error:", error.message);
  }
}

async function makePhoneCall() {
  if (!twilioClient) {
    console.warn("⚠️ Twilio disconnected. Call failed.");
    return;
  }
  try {
    await twilioClient.calls.create({
      twiml: "<Response><Say>Warning. High disaster risk detected. Please take precaution immediately.</Say></Response>",
      from: process.env.7339448676,
      to: process.env.7339448676
    });
    console.log("📞 Call Initiated successfully.");
  } catch (error) {
    console.error("Call Error:", error.message);
  }
}

async function sendEmailAlert(data, riskLevel) {
  try {
    const alertEmail = process.env.earlywarning34@gmail.com || process.env.earlywarning34@gmail.com;
    const mailOptions = {
      from: `"AquaGuard AI System" <${process.env.earlywarning34@gmail.com
  }> `,
      to: alertEmail,
      subject: "AquaGuardAI Disaster Alert",
      html: `
    < h2 >🚨 High Disaster Risk Detected 🚨</h2 >
        <p><strong>Risk Level:</strong> <span style="color:red">${riskLevel}</span></p>
        <ul>
          <li><strong>Rainfall:</strong> ${data.rainfall} mm</li>
          <li><strong>River Level:</strong> ${data.river_level} m</li>
          <li><strong>Wind Speed:</strong> ${data.wind_speed} km/h</li>
          <li><strong>Soil Moisture:</strong> ${data.soil_moisture}%</li>
        </ul>
        <p>Please take precaution immediately.</p>
  `
    };
    await transporter.sendMail(mailOptions);
    console.log("📧 Email Sent successfully.");
  } catch (error) {
    console.error("Email Alert Error:", error.message);
  }
}

async function triggerAlerts(sensorData) {
  const risks = calculateRisks(sensorData);
  if (risks.risk_level === 'high' || risks.risk_level === 'critical' || sensorData.forceAlert) { // Adding forceAlert flag for simulate route
    console.log("🔔 Triggering Disaster Alerts!");
    await sendSMSAlert();
    await makePhoneCall();
    await sendEmailAlert(sensorData, risks.risk_level);
  }
}

// ==========================================
// 📍 TAMIL NADU EXACT COORDINATES
// ==========================================
const TN_LOCATIONS = [
  { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
  { id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
  { id: 3, name: 'Madurai', latitude: 9.9252, longitude: 78.1198 },
  { id: 4, name: 'Tiruchirappalli', latitude: 10.7905, longitude: 78.7047 },
  { id: 5, name: 'Salem', latitude: 11.6643, longitude: 78.1460 }
];

let liveSensorData = {};

TN_LOCATIONS.forEach(loc => {
  liveSensorData[loc.id] = {
    location_id: loc.id,
    name: loc.name,
    latitude: loc.latitude,
    longitude: loc.longitude,
    rainfall: 0.0,
    temperature: 32.0,
    humidity: 60.0,
    wind_speed: 15.0,
    soil_moisture: 45.0,
    river_level: 1.5,
    timestamp: new Date()
  };
});

// ==========================================
// 🌦️ REAL-TIME WEATHER API INTEGRATION
// ==========================================
async function fetchRealTNWeather() {
  try {
    const promises = TN_LOCATIONS.map(async (loc) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&hourly=soil_moisture_0_to_7cm`;
  const response = await axios.get(url, { timeout: 10000 });
  const current = response.data.current;
  const hourly = response.data.hourly;

  liveSensorData[loc.id] = {
    ...liveSensorData[loc.id],
    temperature: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    rainfall: current.precipitation,
    wind_speed: current.wind_speed_10m,
    soil_moisture: hourly.soil_moisture_0_to_7cm[0] * 100 || 45.0,
    timestamp: new Date()
  };
});

await Promise.all(promises);
console.log("✅ Synced accurate real-time weather data for Tamil Nadu");
  } catch (error) {
  console.error("⚠️ Weather API Sync Failed. Using base heuristics.");
}
}

fetchRealTNWeather();
setInterval(fetchRealTNWeather, 5 * 60 * 1000);

// ==========================================
// 🧠 AI RISK PREDICTION ENGINE
// ==========================================
function calculateRisks(data) {
  const floodRisk = Math.min(((data.river_level / 8) * 0.6) + ((data.rainfall / 50) * 0.4), 1);
  const landslideRisk = Math.min(((data.soil_moisture / 100) * 0.5) + ((data.rainfall / 50) * 0.5), 1);
  const surgeRisk = Math.min(data.wind_speed / 150, 1);

  let fireRisk = 0;
  if (data.temperature > 30) {
    const tempFactor = Math.min((data.temperature - 30) / 20, 1) * 0.4;
    const humFactor = Math.max((100 - data.humidity) / 100, 0) * 0.3;
    const windFactor = Math.min(data.wind_speed / 100, 1) * 0.2;
    const soilFactor = Math.max((100 - data.soil_moisture) / 100, 0) * 0.1;
    fireRisk = tempFactor + humFactor + windFactor + soilFactor;
  }

  const maxRisk = Math.max(floodRisk, landslideRisk, surgeRisk, fireRisk);
  const risk_level = maxRisk > 0.75 ? 'critical' : maxRisk > 0.5 ? 'high' : maxRisk > 0.25 ? 'moderate' : 'safe';

  return {
    risk_level,
    flood_probability: floodRisk,
    landslide_probability: landslideRisk,
    storm_surge_probability: surgeRisk,
    fire_probability: Math.min(fireRisk, 1)
  };
}

// ==========================================
// 🚀 ROUTES
// ==========================================
app.get("/", (req, res) => res.json({ status: "active", location: "Tamil Nadu" }));
app.get("/api/locations", (req, res) => res.json(TN_LOCATIONS));
app.get("/api/latest-data", (req, res) => res.json(Object.values(liveSensorData)));

app.get("/api/alerts", (req, res) => {
  const alerts = [];
  Object.values(liveSensorData).forEach(data => {
    const risks = calculateRisks(data);
    if (risks.fire_probability > 0.6) {
      alerts.push({ id: Date.now() + 1, type: "Fire", severity: 'CRITICAL', message: `🔥 High Fire Risk detected in ${data.name} due to elevated temperatures (${data.temperature}°C) and dry conditions.`, timestamp: new Date() });
    }
    if (risks.flood_probability > 0.6) {
      alerts.push({ id: Date.now() + 2, type: "Flood", severity: 'WARNING', message: `🌊 Elevated Flood Risk in ${data.name} due to high rainfall and river levels.`, timestamp: new Date() });
    }
  });
  res.json(alerts.length ? alerts : []);
});

app.post("/api/simulate", (req, res) => {
  try {
    const { rainfall, river_level, soil_moisture, wind_speed, temperature, humidity } = req.body;
    const simulatedData = { rainfall, river_level, soil_moisture, wind_speed, temperature, humidity };
    const predictions = calculateRisks(simulatedData);

    res.json({
      ...predictions,
      prediction_6h: `Based on Tamil Nadu regional models, condition is expected to remain ${predictions.risk_level.toUpperCase()} over the next 6 hours.`
    });
  } catch (error) {
    res.status(500).json({ error: "Simulation Engine Offline." });
  }
});

// 🔥 NEW ROUTE: Simulate Risk (Triggers alerts)
app.post("/simulate-risk", async (req, res) => {
  try {
    const simulatedData = {
      rainfall: 30,
      river_level: 1.6,
      wind_speed: 45,
      soil_moisture: 10,
      temperature: 35,
      humidity: 30,
      forceAlert: true // Forcing alert dispatch
    };

    console.log("⚠️ /simulate-risk endpoint hit. Simulating HIGH risk data.");
    await triggerAlerts(simulatedData);

    res.json({
      success: true,
      message: "Simulated high risk conditions. Alerts triggered.",
      simulatedData
    });
  } catch (error) {
    console.error("Failed to simulate risk:", error);
    res.status(500).json({ error: "Failed to simulate risk" });
  }
});

// 🔥 EXISTING ROUTE: Trigger Email Alert
app.post("/api/send-email-alert", async (req, res) => {
  try {
    const { message, severity, type } = req.body;

    const mailOptions = {
      from: '"AquaGuard AI Warning System" <earlywarning34@gmail.com>',
      to: 'earlywarning34@gmail.com', // Sending to yourself as requested
      subject: `🚨 ${severity} ${type ? type.toUpperCase() : 'DISASTER'} ALERT - ACTION REQUIRED`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid ${severity === 'CRITICAL' ? 'red' : 'orange'}; border-radius: 10px; max-width: 600px; margin: auto;">
          <h2 style="color: ${severity === 'CRITICAL' ? 'red' : 'orange'}; text-align: center;">⚠️ OFFICIAL AI WARNING NOTIFICATION ⚠️</h2>
          <hr />
          <p><strong>Severity Level:</strong> <span style="color: white; background-color: ${severity === 'CRITICAL' ? 'red' : 'orange'}; padding: 3px 8px; border-radius: 4px;">${severity}</span></p>
          <p><strong>Threat Type:</strong> ${type || 'Multiple Factors'}</p>
          <p><strong>Time Detected:</strong> ${new Date().toLocaleString()}</p>
          <div style="background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin-top: 15px;">
            <p style="margin: 0; font-size: 16px;"><strong>Details:</strong></p>
            <p style="margin-top: 5px;">${message}</p>
          </div>
          <p style="text-align: center; margin-top: 20px; font-size: 12px; color: gray;">Generated automatically by AquaGuard AI Simulation & Monitoring Engine</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Email Alert Broadcasted Successfully!" });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ error: "Failed to send email. Check your Gmail App Passwords setup." });
  }
});

// ==========================================
// ⚡ REAL-TIME WEBSOCKET STREAM
// ==========================================
setInterval(() => {
  TN_LOCATIONS.forEach(loc => {
    let current = liveSensorData[loc.id];
    current.temperature = (Number(current.temperature) + (Math.random() * 0.2 - 0.1)).toFixed(1);
    current.humidity = Math.max(0, Math.min(100, (Number(current.humidity) + (Math.random() * 0.4 - 0.2)))).toFixed(1);
    current.wind_speed = Math.max(0, (Number(current.wind_speed) + (Math.random() * 1.0 - 0.5)).toFixed(1));
    current.timestamp = new Date();

    io.emit("sensorUpdate", { location_id: loc.id, data: current });
    io.emit("riskUpdate", { location_id: loc.id, prediction: calculateRisks(current) });
  });
}, 3000);

io.on("connection", (socket) => {
  console.log("🟢 Frontend Dashboard Connected:", socket.id);
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 Tamil Nadu AI Backend running on port ${PORT}`));