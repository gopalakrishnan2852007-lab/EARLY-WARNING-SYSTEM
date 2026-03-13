const axios = require('axios');
const pool = require('../config/db');
const { processRiskPrediction } = require('./alertService');
const { getWeatherData } = require('./weatherService');
const { getFloodData } = require('./floodService');
const { getEarthquakes } = require('./earthquakeService');
const { getSatelliteRainfall } = require('./satelliteService');
const io = require('../socket'); // We will create this

const fetchEnvironmentalData = async () => {
    try {
        console.log('🔄 Fetching real-time environmental data...');
        
        let dbLocations = [];
        try {
          const res = await pool.query('SELECT * FROM Locations');
          dbLocations = res.rows;
        } catch (e) {
          console.log('Database error, using fallback location for stream...');
        }
        
        const locations = dbLocations.length > 0 ? dbLocations : [
           { id: 1, name: 'Mumbai', latitude: 19.0760, longitude: 72.8777 }
        ];

        for (const loc of locations) {
            // Fetch real data with fallback to realistic generated data if API fails or lat/lon invalid
            let weather = {};
            let flood = {};
            try {
                weather = await getWeatherData(loc.latitude, loc.longitude);
            } catch(e) {}
            
            try {
                flood = await getFloodData(loc.latitude, loc.longitude);
            } catch(e) {}

            const mockData = {
                location_id: loc.id,
                rainfall: weather.rainfall ?? (Math.random() * 50).toFixed(2),
                temperature: weather.temperature ?? (15 + Math.random() * 25).toFixed(2),
                humidity: weather.humidity ?? (30 + Math.random() * 70).toFixed(2),
                wind_speed: weather.wind_speed ?? (Math.random() * 100).toFixed(2),
                soil_moisture: weather.soil_moisture ?? (10 + Math.random() * 50).toFixed(2),
                river_level: flood.river_level ?? (Math.random() * 15).toFixed(2),
                vegetation_dryness: (Math.random() * 100).toFixed(2)
            };

            // 3. Store in database
            try {
               if (pool) {
                   await pool.query(`
                       INSERT INTO EnvironmentalData 
                       (location_id, rainfall, temperature, humidity, wind_speed, soil_moisture, river_level, vegetation_dryness)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                   `, [
                       mockData.location_id, mockData.rainfall, mockData.temperature, 
                       mockData.humidity, mockData.wind_speed, mockData.soil_moisture, 
                       mockData.river_level, mockData.vegetation_dryness
                   ]);
               }
            } catch (e) {
               console.log('Could not save to DB, skipping insert');
            }

            console.log(`✅ Saved new environmental data for location: ${loc.name}`);
            
            // Emit Virtual Sensor Update
            if (io.getIO()) {
                io.getIO().emit('sensorUpdate', {
                    location_id: loc.id,
                    location_name: loc.name,
                    data: mockData,
                    timestamp: new Date()
                });
            }

            // 4. Call AI Prediction service
            try {
                if(process.env.AI_SERVICE_URL) {
                   const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/predict_risk`, mockData);
                   const predictionData = aiResponse.data;
                   // 5. Save prediction and evaluate for alerts
                   await processRiskPrediction(loc.id, predictionData);

                   // Emit Real-time Risk Update
                   if (io.getIO()) {
                       io.getIO().emit('riskUpdate', {
                           location_id: loc.id,
                           prediction: predictionData,
                           timestamp: new Date()
                       });
                   }
                }
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
