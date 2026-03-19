const axios = require('axios');
const pool = require('../config/db');
const { processRiskPrediction } = require('./alert.service');
const { getWeatherData } = require('./weatherService');
const { getFloodData } = require('./floodService');

/* ======================================================
   SENTINELALERT — Data Ingestion Service
   Fetches real TN weather + flood data every cycle
   Falls back to realistic generated data if APIs fail
====================================================== */

// ── Tamil Nadu Locations (fallback) ───────────────────
const TN_LOCATIONS = [
    { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
    { id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
    { id: 3, name: 'Madurai', latitude: 9.9252, longitude: 78.1198 },
    { id: 4, name: 'Tiruchirappalli', latitude: 10.7905, longitude: 78.7047 },
    { id: 5, name: 'Salem', latitude: 11.6643, longitude: 78.1460 },
];

// ── Internal risk calculator (no Python needed) ────────
function calculateRisks(data) {
    // Flood Risk = Water Level(40%) + Rain(35%) + Humidity(25%)
    const waterScore = Math.min((data.water_level || data.river_level * 10 || 0) / 100, 1);
    const rainScore = Math.min((data.rainfall || 0) / 100, 1);
    const humidityScore = Math.min((data.humidity || 50) / 100, 1);
    const floodRisk = waterScore * 0.4 + rainScore * 0.35 + humidityScore * 0.25;

    // Fire Risk = Gas(40%) + Temp(40%) + Inverse Humidity(20%)
    const gasScore = Math.min((data.gas || 0) / 1000, 1);
    const tempScore = data.temperature > 30 ? Math.min((data.temperature - 30) / 20, 1) : 0;
    const humidInverse = Math.max(0, 1 - (data.humidity || 50) / 100);
    const fireRisk = gasScore * 0.4 + tempScore * 0.4 + humidInverse * 0.2;

    const landslideRisk = Math.min(floodRisk * 0.6, 1);
    const stormSurgeRisk = Math.min(floodRisk * 0.4, 1);

    const maxRisk = Math.max(floodRisk, fireRisk);
    const riskLevel =
        maxRisk > 0.75 ? 'critical' :
            maxRisk > 0.50 ? 'high' :
                maxRisk > 0.25 ? 'moderate' : 'safe';

    return {
        risk_level: riskLevel,
        risk_score: Number(maxRisk.toFixed(3)),
        flood_probability: Number(floodRisk.toFixed(3)),
        fire_probability: Number(fireRisk.toFixed(3)),
        landslide_probability: Number(landslideRisk.toFixed(3)),
        storm_surge_probability: Number(stormSurgeRisk.toFixed(3)),
        confidence: 0.85,
    };
}

/* ── Get IO safely ────────────────────────────────────── */
function getIO() {
    return global.io || null;
}

/* ── Main Ingestion Loop ──────────────────────────────── */
const fetchEnvironmentalData = async () => {
    try {
        console.log('🔄 SentinelAlert: Fetching TN environmental data...');

        // Load locations from DB or fallback
        let locations = TN_LOCATIONS;
        if (pool) {
            try {
                const { rows } = await pool.query('SELECT * FROM Locations');
                if (rows.length > 0) locations = rows;
            } catch (e) {
                console.warn('⚠️  DB location fetch failed, using fallback TN locations');
            }
        }

        for (const loc of locations) {

            // ── Fetch real weather data ──────────────────────
            let weather = {};
            let flood = {};

            try { weather = await getWeatherData(loc.latitude, loc.longitude); } catch (e) { }
            try { flood = await getFloodData(loc.latitude, loc.longitude); } catch (e) { }

            // ── Build sensor data (real + fallback) ──────────
            const sensorData = {
                location_id: loc.id,
                name: loc.name,
                latitude: loc.latitude,
                longitude: loc.longitude,
                rainfall: weather.rainfall ?? Number((Math.random() * 30).toFixed(2)),
                temperature: weather.temperature ?? Number((25 + Math.random() * 15).toFixed(2)),
                humidity: weather.humidity ?? Number((40 + Math.random() * 50).toFixed(2)),
                wind_speed: weather.wind_speed ?? Number((Math.random() * 60).toFixed(2)),
                soil_moisture: weather.soil_moisture ?? Number((20 + Math.random() * 40).toFixed(2)),
                river_level: flood.river_level ?? Number((Math.random() * 8).toFixed(2)),
                water_level: flood.water_level ?? Number((Math.random() * 60).toFixed(2)),
                gas: 120 + Math.random() * 80,   // MQ-2 baseline ppm
                vegetation_dryness: Number((Math.random() * 100).toFixed(2)),
                timestamp: new Date(),
            };

            // ── Save to DB ───────────────────────────────────
            if (pool) {
                try {
                    await pool.query(`
            INSERT INTO EnvironmentalData
            (location_id, rainfall, temperature, humidity, wind_speed, soil_moisture, river_level, vegetation_dryness)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
                        sensorData.location_id, sensorData.rainfall,
                        sensorData.temperature, sensorData.humidity,
                        sensorData.wind_speed, sensorData.soil_moisture,
                        sensorData.river_level, sensorData.vegetation_dryness,
                    ]);
                    console.log(`✅ Saved environmental data for: ${loc.name}`);
                } catch (e) {
                    console.warn(`⚠️  DB insert failed for ${loc.name}:`, e.message);
                }
            }

            // ── Emit sensor update to frontend ───────────────
            const io = getIO();
            if (io) {
                io.emit('sensorUpdate', {
                    location_id: loc.id,
                    location_name: loc.name,
                    data: sensorData,
                    timestamp: new Date(),
                });
            }

            // ── Calculate risk (Python AI or internal) ───────
            let predictionData = null;

            if (process.env.AI_SERVICE_URL) {
                // Try Python microservice first
                try {
                    const aiResponse = await axios.post(
                        `${process.env.AI_SERVICE_URL}/predict_risk`,
                        sensorData,
                        { timeout: 5000 }
                    );
                    predictionData = aiResponse.data;
                    console.log(`🤖 Python AI prediction for ${loc.name}: ${predictionData.risk_level}`);
                } catch (aiError) {
                    console.warn(`⚠️  Python AI unavailable for ${loc.name}, using internal engine`);
                }
            }

            // Fallback to internal JS risk engine
            if (!predictionData) {
                predictionData = calculateRisks(sensorData);
                predictionData.name = loc.name;
            }

            // ── Emit risk update to frontend ─────────────────
            if (io) {
                io.emit('riskUpdate', {
                    location_id: loc.id,
                    prediction: predictionData,
                    timestamp: new Date(),
                });
            }

            // ── Process alerts (Twilio + DB + WebSocket) ─────
            await processRiskPrediction(loc.id, {
                ...predictionData,
                name: loc.name,
            });
        }

        console.log('✅ SentinelAlert: Environmental data cycle complete');

    } catch (error) {
        console.error('❌ Data ingestion error:', error.message);
    }
};

module.exports = { fetchEnvironmentalData };