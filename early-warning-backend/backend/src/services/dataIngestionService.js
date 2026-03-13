const axios = require('axios');
const pool = require('../config/db');
const { processRiskPrediction } = require('./alertService');

// In a real scenario, you'd use real APIs like OpenWeatherMap, NASA GPM, etc.
// Here we are building a mock service to simulate incoming environmental data
// since real API keys aren't provided yet.
const fetchEnvironmentalData = async () => {
    try {
        console.log('🔄 Fetching real-time environmental data...');
        
        // 1. Get all active locations
        const { rows: locations } = await pool.query('SELECT id, name FROM Locations');
        
        if (locations.length === 0) {
            console.log('No locations found to fetch data for.');
            return;
        }

        // 2. Simulate fetching data for each location
        for (const loc of locations) {
            // Mock random data generation based on realistic ranges
            const mockData = {
                location_id: loc.id,
                rainfall: (Math.random() * 50).toFixed(2), // mm
                temperature: (15 + Math.random() * 25).toFixed(2), // Celsius
                humidity: (30 + Math.random() * 70).toFixed(2), // %
                wind_speed: (Math.random() * 100).toFixed(2), // km/h
                soil_moisture: (10 + Math.random() * 50).toFixed(2), // %
                river_level: (Math.random() * 15).toFixed(2), // meters
                vegetation_dryness: (Math.random() * 100).toFixed(2) // index
            };

            // 3. Store in database
            await pool.query(`
                INSERT INTO EnvironmentalData 
                (location_id, rainfall, temperature, humidity, wind_speed, soil_moisture, river_level, vegetation_dryness)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                mockData.location_id, mockData.rainfall, mockData.temperature, 
                mockData.humidity, mockData.wind_speed, mockData.soil_moisture, 
                mockData.river_level, mockData.vegetation_dryness
            ]);

            console.log(`✅ Saved new environmental data for location: ${loc.name}`);
            
            // 4. Call AI Prediction service
            try {
                const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/predict_risk`, mockData);
                const predictionData = aiResponse.data;
                
                // 5. Save prediction and evaluate for alerts
                await processRiskPrediction(loc.id, predictionData);
            } catch (aiError) {
                console.error(`❌ Failed to get AI prediction for ${loc.name}:`, aiError.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Error fetching environmental data:', error.message);
    }
};

module.exports = {
    fetchEnvironmentalData
};
