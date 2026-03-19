const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const axios = require("axios");
const nodemailer = require("nodemailer");
const twilio = require("twilio");
const dns = require("dns");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ── Critical Fix: Force IPv4 for Render email ──────────────────────────────
dns.setDefaultResultOrder("ipv4first");

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors({ origin: "*" }));
app.use(express.json());

/* ======================================================
   ENVIRONMENT CHECKS
====================================================== */
const ALERT_PHONE = process.env.ALERT_PHONE_NUMBER;
if (ALERT_PHONE && !ALERT_PHONE.startsWith("+")) {
  console.warn("⚠️  ALERT_PHONE_NUMBER must be in E.164 format (e.g. +91XXXXXXXXXX)");
}

/* ======================================================
   ALERT COOLDOWN — prevent SMS/call spam
====================================================== */
let lastAlertTime = 0;
const ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

function canTriggerAlert() {
  const now = Date.now();
  if (now - lastAlertTime > ALERT_COOLDOWN_MS) {
    lastAlertTime = now;
    return true;
  }
  const remaining = Math.ceil((ALERT_COOLDOWN_MS - (now - lastAlertTime)) / 1000);
  console.log(`⏳ Alert cooldown active. Next alert in ${remaining}s`);
  return false;
}

/* ======================================================
   EMAIL ENGINE
====================================================== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ======================================================
   TWILIO ENGINE
====================================================== */
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ── SMS Alert ──────────────────────────────────────────────────────────────
async function sendSMSAlert(riskLevel, sensorData) {
  try {
    const floodRisk = Math.round((sensorData.flood_probability || 0) * 100);
    const fireRisk = Math.round((sensorData.fire_probability || 0) * 100);

    const body =
      `🚨 SentinelAlert WARNING!\n` +
      `Type: ${fireRisk > floodRisk ? "🔥 FIRE" : "🌊 FLOOD"} ALERT\n` +
      `Risk Level: ${riskLevel.toUpperCase()}\n` +
      `Flood Risk: ${floodRisk}%\n` +
      `Fire Risk: ${fireRisk}%\n` +
      `Temp: ${sensorData.temperature || "N/A"}°C\n` +
      `Rainfall: ${sensorData.rainfall || "N/A"} mm/h\n` +
      `Wind: ${sensorData.wind_speed || "N/A"} km/h\n` +
      `Time: ${new Date().toLocaleString("en-IN")}\n` +
      `Stay Safe! — SentinelAlert System`;

    await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: ALERT_PHONE,
    });
    console.log("📱 SMS Sent Successfully");
    return { type: "SMS", success: true };
  } catch (error) {
    console.error("❌ SMS Error:", error.message);
    return { type: "SMS", success: false, error: error.message };
  }
}

// ── Phone Call Alert ───────────────────────────────────────────────────────
async function makePhoneCall(riskLevel, sensorData) {
  try {
    const alertType =
      (sensorData.fire_probability || 0) > (sensorData.flood_probability || 0)
        ? "fire"
        : "flood";

    const twimlMessage = `
      <Response>
        <Say voice="Polly.Aditi">
          Attention. This is an emergency alert from Sentinel Alert Early Warning System.
          <break time="1s"/>
          A ${riskLevel} ${alertType} risk has been detected in your monitored area.
          <break time="1s"/>
          Please take immediate precautionary measures and check the Sentinel Alert dashboard.
          <break time="1s"/>
          I repeat. ${riskLevel} ${alertType} risk detected.
          <break time="1s"/>
          Please evacuate if necessary and stay safe.
        </Say>
      </Response>
    `;

    await twilioClient.calls.create({
      twiml: twimlMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: ALERT_PHONE,
    });
    console.log("📞 Phone Call Sent Successfully");
    return { type: "Call", success: true };
  } catch (error) {
    console.error("❌ Call Error:", error.message);
    return { type: "Call", success: false, error: error.message };
  }
}

// ── Email Alert ────────────────────────────────────────────────────────────
async function sendEmailAlert(sensorData, riskLevel) {
  try {
    const floodRisk = Math.round((sensorData.flood_probability || 0) * 100);
    const fireRisk = Math.round((sensorData.fire_probability || 0) * 100);
    const alertColor = riskLevel === "critical" ? "#dc2626" : riskLevel === "high" ? "#ea580c" : "#d97706";

    const mailOptions = {
      from: `"SentinelAlert System" <${process.env.EMAIL_USER}>`,
      to: process.env.ALERT_EMAIL,
      subject: `🚨 SentinelAlert — ${riskLevel.toUpperCase()} Risk Detected`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #e2e8f0; border-radius: 16px; overflow: hidden; border: 1px solid ${alertColor};">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0f0f1a, #1a0000); padding: 30px; text-align: center; border-bottom: 1px solid ${alertColor}33;">
            <div style="font-size: 36px; margin-bottom: 8px;">🚨</div>
            <h1 style="color: ${alertColor}; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase;">
              SentinelAlert
            </h1>
            <p style="color: #94a3b8; margin: 8px 0 0; font-size: 13px; letter-spacing: 0.2em; text-transform: uppercase;">
              Early Warning System
            </p>
          </div>

          <!-- Alert Badge -->
          <div style="padding: 24px; text-align: center; background: ${alertColor}11;">
            <div style="display: inline-block; background: ${alertColor}22; border: 2px solid ${alertColor}; border-radius: 12px; padding: 12px 32px;">
              <div style="color: ${alertColor}; font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em;">
                ${riskLevel} RISK DETECTED
              </div>
            </div>
          </div>

          <!-- Risk Scores -->
          <div style="padding: 0 24px 24px; display: flex; gap: 16px;">
            <div style="flex: 1; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); border-radius: 12px; padding: 16px; text-align: center;">
              <div style="color: #60a5fa; font-size: 32px; font-weight: 900;">${floodRisk}%</div>
              <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 4px;">🌊 Flood Risk</div>
            </div>
            <div style="flex: 1; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 16px; text-align: center;">
              <div style="color: #f87171; font-size: 32px; font-weight: 900;">${fireRisk}%</div>
              <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 4px;">🔥 Fire Risk</div>
            </div>
          </div>

          <!-- Sensor Data -->
          <div style="padding: 0 24px 24px;">
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px;">
              <h3 style="color: #94a3b8; margin: 0 0 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em;">Live Sensor Readings</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${[
          ["🌡️ Temperature", `${sensorData.temperature || "N/A"} °C`],
          ["💧 Rainfall", `${sensorData.rainfall || "N/A"} mm/h`],
          ["🌊 River Level", `${sensorData.river_level || "N/A"} m`],
          ["💨 Wind Speed", `${sensorData.wind_speed || "N/A"} km/h`],
          ["🌿 Soil Moisture", `${sensorData.soil_moisture || "N/A"} %`],
          ["💦 Humidity", `${sensorData.humidity || "N/A"} %`],
        ].map(([label, value]) => `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 10px 0; color: #64748b; font-size: 13px;">${label}</td>
                    <td style="padding: 10px 0; color: #e2e8f0; font-weight: 700; text-align: right; font-size: 13px;">${value}</td>
                  </tr>
                `).join("")}
              </table>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 20px 24px; background: rgba(0,0,0,0.3); text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
            <p style="color: #475569; font-size: 11px; margin: 0;">
              Generated at ${new Date().toLocaleString("en-IN")} by SentinelAlert Early Warning System
            </p>
            <p style="color: #334155; font-size: 10px; margin: 8px 0 0;">
              Please check the live dashboard for real-time updates
            </p>
          </div>
        </div>
      `,
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
   ALERT TRIGGER — with cooldown
====================================================== */
async function triggerAlerts(sensorData) {
  const risks = calculateRisks(sensorData);

  if (risks.risk_level === "high" || risks.risk_level === "critical") {
    if (!canTriggerAlert()) {
      return [{ message: "Cooldown active, alert skipped" }];
    }

    console.log(`🚨 Triggering SentinelAlert for Risk Level: ${risks.risk_level}`);

    const enrichedData = { ...sensorData, ...risks };
    const [smsResult, callResult, emailResult] = await Promise.all([
      sendSMSAlert(risks.risk_level, enrichedData),
      makePhoneCall(risks.risk_level, enrichedData),
      sendEmailAlert(enrichedData, risks.risk_level),
    ]);

    // Emit to all frontends
    io.emit("new_alert", {
      id: Math.random().toString(36).substring(7),
      type: risks.fire_probability > risks.flood_probability ? "Fire" : "Flood",
      severity: risks.risk_level.toUpperCase(),
      message: `⚡ SentinelAlert: ${risks.risk_level.toUpperCase()} risk detected. Flood: ${Math.round(risks.flood_probability * 100)}%, Fire: ${Math.round(risks.fire_probability * 100)}%. Emergency services notified.`,
      timestamp: new Date().toISOString(),
    });

    return [smsResult, callResult, emailResult];
  }

  return [{ message: `Risk level ${risks.risk_level} — no alerts triggered` }];
}

/* ======================================================
   TAMIL NADU LOCATIONS
====================================================== */
const TN_LOCATIONS = [
  { id: 1, name: "Chennai", latitude: 13.0827, longitude: 80.2707 },
  { id: 2, name: "Coimbatore", latitude: 11.0168, longitude: 76.9558 },
  { id: 3, name: "Madurai", latitude: 9.9252, longitude: 78.1198 },
  { id: 4, name: "Tiruchirappalli", latitude: 10.7905, longitude: 78.7047 },
  { id: 5, name: "Salem", latitude: 11.6643, longitude: 78.1460 },
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
    gas: 120,
    water_level: 30,
    timestamp: new Date(),
  };
});

/* ======================================================
   WEATHER API
====================================================== */
async function fetchRealTNWeather() {
  try {
    const promises = TN_LOCATIONS.map(async (loc) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m`;
      const response = await axios.get(url, { timeout: 8000 });
      const current = response.data.current;

      liveSensorData[loc.id] = {
        ...liveSensorData[loc.id],
        temperature: Number(current.temperature_2m.toFixed(1)),
        humidity: current.relative_humidity_2m,
        rainfall: current.precipitation,
        wind_speed: Number(current.wind_speed_10m.toFixed(1)),
        timestamp: new Date(),
      };
    });

    await Promise.all(promises);
    console.log("✅ TN Weather Data Updated");
  } catch (error) {
    console.error("⚠️  Weather API Error:", error.message);
  }
}

fetchRealTNWeather();
setInterval(fetchRealTNWeather, 5 * 60 * 1000);

/* ======================================================
   AI RISK ENGINE — Weighted scoring
====================================================== */
function calculateRisks(data) {
  // Flood Risk = Water Level (40%) + Rain (35%) + Humidity (25%)
  const waterLevelScore = Math.min((data.water_level || data.river_level * 10 || 0) / 100, 1);
  const rainfallScore = Math.min((data.rainfall || 0) / 100, 1);
  const humidityScore = Math.min((data.humidity || 50) / 100, 1);
  const floodRisk = waterLevelScore * 0.4 + rainfallScore * 0.35 + humidityScore * 0.25;

  // Fire Risk = Gas (40%) + Temperature (40%) + Inverse Humidity (20%)
  const gasScore = Math.min((data.gas || 0) / 1000, 1);
  const tempScore = data.temperature > 30 ? Math.min((data.temperature - 30) / 20, 1) : 0;
  const humidityInverse = Math.max(0, 1 - (data.humidity || 50) / 100);
  const fireRisk = gasScore * 0.4 + tempScore * 0.4 + humidityInverse * 0.2;

  const maxRisk = Math.max(floodRisk, fireRisk);
  const risk_level =
    maxRisk > 0.75 ? "critical" :
      maxRisk > 0.50 ? "high" :
        maxRisk > 0.25 ? "moderate" : "safe";

  return {
    risk_level,
    flood_probability: Math.min(floodRisk, 1),
    fire_probability: Math.min(fireRisk, 1),
    landslide_probability: Math.min(floodRisk * 0.6, 1),
    storm_surge_probability: Math.min(floodRisk * 0.4, 1),
  };
}

/* ======================================================
   ALERT LOG (in-memory)
====================================================== */
let alertHistory = [];

function pushAlert(alert) {
  alertHistory = [alert, ...alertHistory].slice(0, 100);
  io.emit("new_alert", alert);
}

/* ======================================================
   ROUTES
====================================================== */

// Health Check
app.get("/", (req, res) => {
  res.json({
    status: "✅ SentinelAlert Backend Running",
    version: "2.0.0",
    uptime: process.uptime().toFixed(0) + "s",
    locations: TN_LOCATIONS.length,
    alerts: alertHistory.length,
  });
});

// Latest sensor data
app.get("/api/latest-data", (req, res) => {
  res.json(Object.values(liveSensorData));
});

// Alert history
app.get("/api/alerts", (req, res) => {
  res.json(alertHistory.slice(0, 50));
});

// Locations
app.get("/api/locations", (req, res) => {
  res.json(TN_LOCATIONS);
});

/* ── ESP32 Sensor Ingestion ───────────────────────────────────────────────── */
app.post("/api/sensors", (req, res) => {
  try {
    const {
      temperature, humidity, gas, rain,
      water_level, location_id = 1,
    } = req.body;

    // Update live data store
    liveSensorData[location_id] = {
      ...liveSensorData[location_id],
      temperature: temperature ?? liveSensorData[location_id]?.temperature,
      humidity: humidity ?? liveSensorData[location_id]?.humidity,
      gas: gas ?? liveSensorData[location_id]?.gas,
      rainfall: rain ?? liveSensorData[location_id]?.rainfall,
      water_level: water_level ?? liveSensorData[location_id]?.water_level,
      timestamp: new Date(),
    };

    const risks = calculateRisks(liveSensorData[location_id]);

    // Emit realtime to frontend
    io.emit("sensorUpdate", {
      location_id,
      data: liveSensorData[location_id],
    });
    io.emit("riskUpdate", { location_id, prediction: risks });

    // Trigger alerts if needed (non-blocking)
    if (risks.risk_level === "high" || risks.risk_level === "critical") {
      triggerAlerts({ ...liveSensorData[location_id], ...risks }).catch(console.error);
    }

    res.json({ success: true, risks, message: "Sensor data received" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ── Manual Email Alert ───────────────────────────────────────────────────── */
app.post("/api/send-email-alert", async (req, res) => {
  try {
    const { message, severity, type } = req.body;
    const fakeData = {
      temperature: 42, humidity: 20, rainfall: 150,
      river_level: 8, wind_speed: 80, soil_moisture: 10,
      flood_probability: type === "Flood" ? 0.85 : 0.3,
      fire_probability: type === "Fire" ? 0.85 : 0.3,
      gas: 500, water_level: 85,
    };
    await sendEmailAlert({ ...fakeData, message }, severity);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── Manual Twilio Test ───────────────────────────────────────────────────── */
app.post("/api/test-alert", async (req, res) => {
  try {
    const testData = {
      temperature: 42, humidity: 15, rainfall: 200,
      river_level: 9, wind_speed: 120, soil_moisture: 5,
      gas: 600, water_level: 90,
      flood_probability: 0.9, fire_probability: 0.85,
    };
    lastAlertTime = 0; // Reset cooldown for test
    const results = await triggerAlerts(testData);
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── Simulation ───────────────────────────────────────────────────────────── */
app.post("/api/simulate", async (req, res) => {
  try {
    const projectedData = req.body;
    const prediction = calculateRisks(projectedData);

    prediction.prediction_6h = `Simulated ${prediction.risk_level.toUpperCase()} scenario. ` +
      `Flood: ${Math.round(prediction.flood_probability * 100)}% · ` +
      `Fire: ${Math.round(prediction.fire_probability * 100)}%. ` +
      `${prediction.risk_level === "critical" || prediction.risk_level === "high"
        ? "Immediate evacuation recommended."
        : "Continue monitoring conditions."}`;

    res.json(prediction);

    // Background alert trigger
    (async () => {
      try {
        if (prediction.risk_level === "high" || prediction.risk_level === "critical") {
          console.log(`⚠️  Simulation: ${prediction.risk_level.toUpperCase()} risk — triggering alerts...`);
          await triggerAlerts({ ...projectedData, ...prediction });
        }
      } catch (bgErr) {
        console.error("Simulation background trigger failed:", bgErr);
      }
    })();
  } catch (error) {
    res.status(500).json({ message: "Simulation error", error: error.message });
  }
});

/* ── Community Report ─────────────────────────────────────────────────────── */
app.post("/api/reports", upload.single("image"), async (req, res) => {
  try {
    const { type, location, details } = req.body;
    const file = req.file;

    let aiEvaluation = {
      visual_evidence: "No image provided. Relying on user text.",
      risk_level: "High",
      trigger_call: true,
    };

    if (file && process.env.GEMINI_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
          Disaster report: Type "${type}" at "${location}". Details: "${details}".
          Analyze the image strictly for visual evidence of disaster.
          Respond ONLY in JSON with:
          - visual_evidence (string)
          - risk_level ("Low" | "Medium" | "High")
          - trigger_call (boolean)
        `;
        const imagePart = {
          inlineData: {
            data: file.buffer.toString("base64"),
            mimeType: file.mimetype,
          },
        };
        const result = await model.generateContent([prompt, imagePart]);
        const cleaned = result.response.text().replace(/```json|```/gi, "").trim();
        aiEvaluation = JSON.parse(cleaned);
      } catch (aiErr) {
        console.error("AI Evaluation failed:", aiErr.message);
      }
    }

    const newAlert = {
      id: Math.random().toString(36).substring(7),
      type: (type || "UNKNOWN").toUpperCase(),
      severity: aiEvaluation.risk_level.toUpperCase(),
      message: `📍 COMMUNITY REPORT: ${(type || "UNKNOWN").toUpperCase()} at ${location || "Unknown"}. AI: ${aiEvaluation.visual_evidence}`,
      timestamp: new Date().toISOString(),
    };

    pushAlert(newAlert);
    res.status(200).json({ success: true, newAlert, aiEvaluation });

    // Background trigger
    (async () => {
      try {
        if (aiEvaluation.risk_level === "High" || aiEvaluation.trigger_call) {
          const simulatedData = {
            rainfall: type === "flood" ? 150 : 0,
            river_level: type === "flood" ? 8 : 1,
            wind_speed: ["fire", "smoke"].includes(type) ? 80 : 20,
            soil_moisture: ["fire", "smoke"].includes(type) ? 5 : 50,
            temperature: ["fire", "smoke"].includes(type) ? 45 : 25,
            humidity: ["fire", "smoke"].includes(type) ? 10 : 80,
            gas: ["fire", "smoke"].includes(type) ? 700 : 120,
            water_level: type === "flood" ? 90 : 20,
          };
          await triggerAlerts(simulatedData);
        }
      } catch (bgErr) {
        console.error("Report background task failed:", bgErr);
      }
    })();
  } catch (error) {
    res.status(500).json({ message: "Report submission failed", error: error.message });
  }
});

/* ======================================================
   REALTIME SOCKET — push updates every 3s
====================================================== */
setInterval(() => {
  TN_LOCATIONS.forEach((loc) => {
    const current = liveSensorData[loc.id];

    // Simulate slight fluctuations on existing data
    current.temperature = Number((current.temperature + (Math.random() * 0.4 - 0.2)).toFixed(1));
    current.humidity = Math.max(10, Math.min(100, current.humidity + (Math.random() * 2 - 1)));
    current.gas = Math.max(0, Math.min(1000, current.gas + (Math.random() * 10 - 5)));
    current.water_level = Math.max(0, Math.min(100, current.water_level + (Math.random() * 2 - 1)));
    current.timestamp = new Date();

    const risks = calculateRisks(current);

    io.emit("sensorUpdate", { location_id: loc.id, data: current });
    io.emit("riskUpdate", { location_id: loc.id, prediction: risks });
  });
}, 3000);

io.on("connection", (socket) => {
  console.log("🟢 Client Connected:", socket.id);

  // Send current data immediately on connect
  socket.emit("initialData", {
    sensors: Object.values(liveSensorData),
    alerts: alertHistory.slice(0, 20),
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client Disconnected:", socket.id);
  });
});

/* ======================================================
   START SERVER
====================================================== */
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   🚨 SentinelAlert Backend v2.0.0   ║
  ║   Running on port ${PORT}               ║
  ║   ESP32 → POST /api/sensors         ║
  ║   Twilio SMS + Call ✅              ║
  ║   Email Alerts ✅                   ║
  ║   WebSocket Live ✅                 ║
  ╚══════════════════════════════════════╝
  `);
});