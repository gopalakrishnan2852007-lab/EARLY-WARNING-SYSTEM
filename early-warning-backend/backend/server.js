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

const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// 🚨 CRITICAL FIX FOR RENDER EMAIL TIMEOUT 🚨
// This forces Render to use IPv4 instead of IPv6, fixing the "Connection timeout" to Gmail
dns.setDefaultResultOrder('ipv4first');

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
  console.warn("⚠️ WARNING: ALERT_PHONE_NUMBER does not start with '+'. Twilio requires E.164 format.");
}

/* ======================================================
   EMAIL ALERT ENGINE
====================================================== */

// Simplified Gmail Config - The DNS fix at the top makes this work on Render
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // MUST be a 16-character App Password
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
      body: "🚨 AquaGuardAI ALERT: High disaster risk detected! Please check the dashboard immediately.",
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

/* PHONE CALL ALERT (FIXED "BLABBERING" ISSUE) */
async function makePhoneCall() {
  try {
    // Using Polly.Aditi (Indian English Natural AI Voice) with SSML for emergency pauses
    const twimlMessage = `
      <Response>
        <Say voice="Polly.Aditi">
          Attention. This is an emergency alert from Aqua Guard A I.
          <break time="1s"/> 
          A High disaster risk has been detected in your monitored area.
          <break time="1s"/> 
          Please take precautionary measures immediately.
          <break time="1s"/> 
          I repeat. High disaster risk detected. Please stay safe.
        </Say>
      </Response>
    `;

    await twilioClient.calls.create({
      twiml: twimlMessage,
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
      subject: "🚨 AquaGuard AI Disaster Alert",
      html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid red; border-radius: 10px;">
        <h2 style="color: red;">🚨 High Disaster Risk Detected</h2>
        <p><strong>Risk Level:</strong> <span style="color:red; text-transform:uppercase; font-size: 18px;">${riskLevel}</span></p>
        <hr/>
        <h3>Current Sensor Readings:</h3>
        <ul>
          <li><strong>Rainfall:</strong> ${data.rainfall} mm</li>
          <li><strong>River Level:</strong> ${data.river_level} m</li>
          <li><strong>Wind Speed:</strong> ${data.wind_speed} km/h</li>
          <li><strong>Soil Moisture:</strong> ${data.soil_moisture}%</li>
        </ul>
        <p style="margin-top: 20px;">Please check the AquaGuard AI dashboard for live updates and take necessary precautions.</p>
      </div>
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

/* ======================================================
   SIMULATION & REPORT ROUTES
====================================================== */

app.post("/api/simulate", async (req, res) => {
  try {
    const projectedData = req.body;
    
    // Calculate risks from frontend simulation sliders
    const prediction = calculateRisks(projectedData);
    prediction.landslide_probability = 0; 
    prediction.storm_surge_probability = 0;
    prediction.prediction_6h = `Simulated scenario generated. Evaluated risk level: ${prediction.risk_level.toUpperCase()}.`;

    // Trigger phone/sms if critical/high
    const alertResults = await triggerAlerts(projectedData);

    res.json({
      ...prediction,
      alerts: alertResults
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during simulation", error: error.message });
  }
});

app.post("/api/reports", upload.single('image'), async (req, res) => {
  try {
    const { type, location, details } = req.body;
    const file = req.file;
    
    let aiEvaluation = {
        visual_evidence: "No image provided. Relying on user text.",
        risk_level: "High", // Fallback to High to trigger alert if no image
        trigger_call: true
    };
    
    // If an image is provided, use Gemini Vision to evaluate it realistically
    if (file && genAI.apiKey) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
          The user is reporting a disaster incident of type: "${type}" at location: "${location}". 
          User's description: "${details}".
          
          Ignore urgent text if the visual evidence is benign. Rely strictly on the image. 
          Output strictly in JSON with fields: 
          - visual_evidence (string: describe what you see)
          - risk_level (string: "Low", "Medium", "High")
          - trigger_call (boolean)
        `;
        
        const imagePart = {
          inlineData: {
            data: file.buffer.toString("base64"),
            mimeType: file.mimetype
          }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        
        // Extract JSON from potential markdown block (e.g., \`\`\`json ... \`\`\`)
        const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        aiEvaluation = JSON.parse(cleanedText);
        
      } catch (aiErr) {
        console.error("AI Evaluation failed, falling back to manual mapping:", aiErr);
      }
    }

    // 1. Immediately respond to frontend to kill the blocking loading spinner!
    const newAlert = {
        id: Math.random().toString(36).substring(7),
        type: type ? type.toUpperCase() : 'UNKNOWN',
        severity: aiEvaluation.risk_level.toUpperCase(),
        message: `COMMUNITY REPORT: ${type ? type.toUpperCase() : 'UNKNOWN'} spotted at ${location || 'Unknown location'}. AI Assessment: ${aiEvaluation.visual_evidence}`,
        timestamp: new Date().toISOString()
    };
    
    res.status(200).json({ 
        success: true, 
        newAlert, 
        aiEvaluation 
    });

    // 2. Asynchronous Background Task: Trigger Global Websockets and Twilio calls decoupled from HTTP
    (async () => {
       try {
         // Broadcast report to all frontend instances to update dashboards instantly
         io.emit("new_alert", newAlert);
         
         // Trigger SMS and Phone call ONLY if risk is High or trigger_call is true
         if (aiEvaluation.risk_level === "High" || aiEvaluation.trigger_call) {
             console.log("⚠️ AI Confirmed High Risk. Triggering Twilio Background Call...");
             const simulatedData = {
                rainfall: type === 'flood' ? 150 : 0,
                river_level: type === 'flood' ? 8 : 1,
                wind_speed: (type === 'fire' || type === 'smoke') ? 80 : 20,
                soil_moisture: (type === 'fire' || type === 'smoke') ? 5 : 50,
                temperature: (type === 'fire' || type === 'smoke') ? 45 : 25,
                humidity: (type === 'fire' || type === 'smoke') ? 10 : 80
             };
             await triggerAlerts(simulatedData);
         } else {
             console.log(`✅ AI Evaluated report as ${aiEvaluation.risk_level}. No panic triggers fired.`);
         }
       } catch (bgError) {
         console.error("Background task failed:", bgError);
       }
    })();
    
  } catch (error) {
    res.status(500).json({ message: "Failed to submit report", error: error.message });
  }
});

/* ======================================================
   REALTIME SOCKET
====================================================== */

setInterval(() => {
  TN_LOCATIONS.forEach((loc) => {
    let current = liveSensorData[loc.id];
    current.temperature = Number(current.temperature) + (Math.random() * 0.2 - 0.1);

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