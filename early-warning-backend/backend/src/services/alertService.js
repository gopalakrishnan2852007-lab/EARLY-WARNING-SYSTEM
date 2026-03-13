const pool = require('../config/db');

// Function to emit alerts to all connected WebSocket clients
const emitAlert = (alert) => {
    if (global.io) {
        global.io.emit('new_alert', alert);
        console.log(`🚨 Alert emitted via WebSocket: [${alert.severity}] ${alert.message}`);
    } else {
        console.warn('⚠️ WebSocket IO instance not globally available.');
    }
};

const processRiskPrediction = async (locationId, predictionData) => {
    try {
        let prediction = {
            risk_level: predictionData.risk_level,
            flood_probability: predictionData.flood_probability,
            landslide_probability: predictionData.landslide_probability,
            storm_surge_probability: predictionData.storm_surge_probability
        };

        // 1. Save Risk Prediction (safe catch)
        if (pool) {
            try {
                const { rows } = await pool.query(`
                    INSERT INTO RiskPredictions 
                    (location_id, risk_score, flood_probability, landslide_probability, storm_surge_probability, risk_level, predicted_time_window)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING *
                `, [
                    locationId,
                    predictionData.risk_score,
                    predictionData.flood_probability,
                    predictionData.landslide_probability,
                    predictionData.storm_surge_probability,
                    predictionData.risk_level,
                    'Next 24 Hours'
                ]);
                prediction = rows[0];
                console.log(`✅ Stored prediction for Location ${locationId}: Level = ${prediction.risk_level}`);
            } catch (e) { console.log('DB error storing prediction, moving to alert emit...'); }
        }

        // 2. Generate Alerts if risk is high or critical
        if (prediction.risk_level === 'high' || prediction.risk_level === 'critical') {

            // Determine alert type based on the highest probability
            let alertType = 'Severe Weather Warning';
            const maxProb = Math.max(prediction.flood_probability, prediction.landslide_probability, prediction.storm_surge_probability);

            if (maxProb === prediction.flood_probability) alertType = 'Flood Warning';
            else if (maxProb === prediction.landslide_probability) alertType = 'Landslide Warning';
            else if (maxProb === prediction.storm_surge_probability) alertType = 'Storm Surge Warning';

            const message = `${prediction.risk_level.toUpperCase()} ${alertType} predicted. Probability: ${(maxProb * 100).toFixed(0)}%. Immediate action may be required. AI Confidence: ${predictionData.confidence}`;

            let newAlert = {
                location_id: locationId,
                alert_type: alertType,
                severity: prediction.risk_level.toUpperCase(),
                message: message,
                timestamp: new Date()
            };

            if (pool) {
                try {
                    const alertResult = await pool.query(`
                        INSERT INTO Alerts 
                        (location_id, alert_type, severity, message, sent_to)
                        VALUES ($1, $2, $3, $4, $5)
                        RETURNING *
                    `, [
                        locationId,
                        alertType,
                        prediction.risk_level, // severity matches risk level
                        message,
                        'All Authorities'
                    ]);
                    newAlert = alertResult.rows[0];
                } catch (e) {
                    console.log('DB error storing alert, using memory alert...')
                }
            }

            // 3. Emit the WebSocket alert
            emitAlert(newAlert);
        }

    } catch (error) {
        console.error(`❌ Error processing risk prediction for location ${locationId}:`, error.message);
    }
};

module.exports = {
    processRiskPrediction,
    emitAlert
};
