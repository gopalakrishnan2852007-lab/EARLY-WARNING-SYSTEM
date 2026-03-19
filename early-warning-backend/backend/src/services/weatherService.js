const axios = require('axios');

/**
 * Fetches current weather data for a given location using Open-Meteo API
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 * @returns {Promise<Object>} Object containing temperature, rainfall, humidity, wind_speed
 */
async function getWeatherData(lat, lon) {
    try {
        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude: lat,
                longitude: lon,
                current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,soil_moisture_3_9cm',
                timezone: 'auto'
            }
        });

        const current = response.data.current;
        return {
            temperature: current.temperature_2m,
            rainfall: current.precipitation,
            humidity: current.relative_humidity_2m,
            wind_speed: current.wind_speed_10m,
            soil_moisture: current.soil_moisture_3_9cm || 0
        };
    } catch (error) {
        console.error(`❌ Error fetching weather data for ${lat}, ${lon}:`, error.message);
        throw error;
    }
}

module.exports = { getWeatherData };
