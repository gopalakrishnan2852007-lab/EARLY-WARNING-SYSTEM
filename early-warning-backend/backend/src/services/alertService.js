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
        // 1. Save Risk Prediction
        const { rows } = await pool.query(`
            INSERT INTO RiskPredictions 
            (location_id, flood_risk_score, fire_risk_score, risk_level, predicted_time_window)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [
            locationId, 
            predictionData.flood_risk_score, 
            predictionData.fire_risk_score, 
            predictionData.risk_level, 
            'Next 24 Hours' // Simple default for now
        ]);

        const prediction = rows[0];
        console.log(`✅ Stored prediction for Location ${locationId}: Level = ${prediction.risk_level}`);

        // 2. Generate Alerts if risk is high or critical
        if (prediction.risk_level === 'high' || prediction.risk_level === 'critical') {
            
            // Determine alert type based on the higher score
            const isFlood = prediction.flood_risk_score > prediction.fire_risk_score;
            const alertType = isFlood ? 'Flood Warning' : 'Wildfire Warning';
            
            const message = `${prediction.risk_level.toUpperCase()} ${alertType} predicted for location ID ${locationId} in the next 24 hours. Immediate action may be required.`;

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

            const newAlert = alertResult.rows[0];
            
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
