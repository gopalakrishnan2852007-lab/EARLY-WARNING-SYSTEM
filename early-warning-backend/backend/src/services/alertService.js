const pool = require('../config/db');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const { generateRiskSummary } = require('./aiService');

/* ======================================================
   SENTINELALERT — Alert Service
   Handles: WebSocket, DB, Twilio SMS/Call, Email
====================================================== */

const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const ALERT_PHONE = process.env.ALERT_PHONE_NUMBER;

// ── Cooldown tracker (in-memory) ───────────────────────
const cooldowns = {};
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

function canTriggerAlert(locationId = 'global') {
    const now = Date.now();
    const last = cooldowns[locationId] || 0;
    if (now - last > COOLDOWN_MS) {
        cooldowns[locationId] = now;
        return true;
    }
    const remaining = Math.ceil((COOLDOWN_MS - (now - last)) / 1000);
    console.log(`⏳ Alert cooldown active for location ${locationId}. Next in ${remaining}s`);
    return false;
}

/* ── Emit WebSocket Alert ─────────────────────────────── */
const emitAlert = (alert) => {
    if (global.io) {
        global.io.emit('new_alert', alert);
        console.log(`🚨 SentinelAlert emitted: [${alert.severity}] ${alert.message}`);
    } else {
        console.warn('⚠️  WebSocket IO not available.');
    }
};

/* ── SMS Alert ────────────────────────────────────────── */
async function sendSMSAlert(alertType, riskLevel, probability, locationName) {
    try {
        const body =
            `🚨 SentinelAlert WARNING!\n` +
            `Type: ${alertType}\n` +
            `Risk: ${riskLevel.toUpperCase()}\n` +
            `Probability: ${probability}%\n` +
            `Location: ${locationName || 'Tamil Nadu'}\n` +
            `Time: ${new Date().toLocaleString('en-IN')}\n` +
            `Stay Safe! — SentinelAlert System`;

        await twilioClient.messages.create({
            body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: ALERT_PHONE,
        });
        console.log('📱 SMS sent successfully');
        return { type: 'SMS', success: true };
    } catch (err) {
        console.error('❌ SMS Error:', err.message);
        return { type: 'SMS', success: false, error: err.message };
    }
}

/* ── Phone Call Alert ─────────────────────────────────── */
async function makePhoneCall(alertType, riskLevel, locationName) {
    try {
        const twiml = `
      <Response>
        <Say voice="Polly.Aditi">
          Attention. This is an emergency alert from Sentinel Alert.
          <break time="1s"/>
          A ${riskLevel} ${alertType} has been detected near ${locationName || 'Tamil Nadu'}.
          <break time="1s"/>
          Please take immediate precautionary measures.
          <break time="1s"/>
          Check the Sentinel Alert dashboard for live updates.
          <break time="1s"/>
          Stay safe. I repeat. ${riskLevel} alert detected. Please act immediately.
        </Say>
      </Response>
    `;

        await twilioClient.calls.create({
            twiml,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: ALERT_PHONE,
        });
        console.log('📞 Phone call sent successfully');
        return { type: 'Call', success: true };
    } catch (err) {
        console.error('❌ Call Error:', err.message);
        return { type: 'Call', success: false, error: err.message };
    }
}

/* ── Email Alert ──────────────────────────────────────── */
async function sendEmailAlert(alertType, riskLevel, probability, locationName, aiSummary) {
    try {
        const alertColor = riskLevel === 'critical' ? '#dc2626' : '#ea580c';

        await transporter.sendMail({
            from: `"SentinelAlert System" <${process.env.EMAIL_USER}>`,
            to: process.env.ALERT_EMAIL,
            subject: `🚨 SentinelAlert — ${riskLevel.toUpperCase()} ${alertType}`,
            html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#e2e8f0;border-radius:16px;overflow:hidden;border:1px solid ${alertColor};">
          <div style="background:linear-gradient(135deg,#0f0f1a,#1a0000);padding:28px;text-align:center;border-bottom:1px solid ${alertColor}33;">
            <h1 style="color:${alertColor};margin:0;font-size:22px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;">
              🚨 SentinelAlert
            </h1>
            <p style="color:#94a3b8;margin:6px 0 0;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;">
              Early Warning System · Tamil Nadu
            </p>
          </div>

          <div style="padding:24px;text-align:center;">
            <div style="display:inline-block;background:${alertColor}22;border:2px solid ${alertColor};border-radius:12px;padding:12px 28px;">
              <div style="color:${alertColor};font-size:24px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;">
                ${riskLevel} ${alertType}
              </div>
              <div style="color:#94a3b8;font-size:13px;margin-top:4px;">
                Probability: ${probability}% · Location: ${locationName || 'Tamil Nadu'}
              </div>
            </div>
          </div>

          ${aiSummary ? `
          <div style="padding:0 24px 20px;">
            <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:12px;padding:16px;">
              <div style="color:#818cf8;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:8px;">
                AI Analysis
              </div>
              <p style="color:#cbd5e1;font-size:13px;margin:0;line-height:1.6;font-style:italic;">
                "${aiSummary}"
              </p>
            </div>
          </div>
          ` : ''}

          <div style="padding:16px 24px;background:rgba(0,0,0,0.3);text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
            <p style="color:#475569;font-size:11px;margin:0;">
              Generated at ${new Date().toLocaleString('en-IN')} · SentinelAlert Early Warning System
            </p>
          </div>
        </div>
      `,
        });
        console.log('📧 Email sent successfully');
        return { type: 'Email', success: true };
    } catch (err) {
        console.error('❌ Email Error:', err.message);
        return { type: 'Email', success: false, error: err.message };
    }
}

/* ======================================================
   MAIN: Process Risk Prediction
====================================================== */
const processRiskPrediction = async (locationId, predictionData) => {
    try {
        let prediction = {
            risk_level: predictionData.risk_level,
            flood_probability: predictionData.flood_probability,
            fire_probability: predictionData.fire_probability || 0,
            landslide_probability: predictionData.landslide_probability || 0,
            storm_surge_probability: predictionData.storm_surge_probability || 0,
        };

        // ── 1. Save to DB ──────────────────────────────────
        if (pool) {
            try {
                const { rows } = await pool.query(`
          INSERT INTO RiskPredictions
          (location_id, risk_score, flood_probability, landslide_probability, storm_surge_probability, risk_level, predicted_time_window)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [
                    locationId,
                    predictionData.risk_score || 0,
                    prediction.flood_probability,
                    prediction.landslide_probability,
                    prediction.storm_surge_probability,
                    prediction.risk_level,
                    'Next 24 Hours',
                ]);
                prediction = { ...prediction, ...rows[0] };
                console.log(`✅ Stored prediction for Location ${locationId}: ${prediction.risk_level}`);
            } catch (e) {
                console.warn('⚠️  DB store failed, continuing with memory prediction...');
            }
        }

        // ── 2. Trigger alerts if high/critical ────────────
        if (prediction.risk_level === 'high' || prediction.risk_level === 'critical') {

            // Determine alert type
            const probs = {
                'Flood Warning': prediction.flood_probability,
                'Fire Warning': prediction.fire_probability,
                'Landslide Warning': prediction.landslide_probability,
                'Storm Surge Warning': prediction.storm_surge_probability,
            };
            const alertType = Object.entries(probs).reduce((a, b) => a[1] > b[1] ? a : b)[0];
            const maxProb = Math.round(Math.max(...Object.values(probs)) * 100);

            // AI summary via Groq
            let aiSummary = null;
            try {
                aiSummary = await generateRiskSummary(predictionData, prediction.risk_level);
            } catch (e) { /* non-blocking */ }

            const message =
                `⚡ SENTINELALERT: ${prediction.risk_level.toUpperCase()} ${alertType} for Location ${locationId}. ` +
                `Probability: ${maxProb}%. ${aiSummary || 'Immediate action may be required.'}`;

            // Build alert object
            let newAlert = {
                id: Math.random().toString(36).substring(7),
                location_id: locationId,
                alert_type: alertType,
                severity: prediction.risk_level.toUpperCase(),
                message,
                timestamp: new Date().toISOString(),
            };

            // Save alert to DB
            if (pool) {
                try {
                    const { rows } = await pool.query(`
            INSERT INTO Alerts
            (location_id, alert_type, severity, message, sent_to)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
          `, [locationId, alertType, prediction.risk_level, message, 'All Authorities']);
                    newAlert = { ...newAlert, ...rows[0] };
                } catch (e) {
                    console.warn('⚠️  DB alert store failed, using memory alert...');
                }
            }

            // ── 3. Emit WebSocket ────────────────────────────
            emitAlert(newAlert);

            // ── 4. Twilio + Email (with cooldown) ────────────
            if (canTriggerAlert(locationId)) {
                const locationName = predictionData.name || `Zone ${locationId}`;

                await Promise.all([
                    sendSMSAlert(alertType, prediction.risk_level, maxProb, locationName),
                    makePhoneCall(alertType, prediction.risk_level, locationName),
                    sendEmailAlert(alertType, prediction.risk_level, maxProb, locationName, aiSummary),
                ]);
            }
        }

    } catch (error) {
        console.error(`❌ Error processing risk for location ${locationId}:`, error.message);
    }
};

module.exports = {
    processRiskPrediction,
    emitAlert,
    sendSMSAlert,
    makePhoneCall,
    sendEmailAlert,
};