const axios = require('axios');

/**
 * Fetches flood and river discharge data (mocking global satellite/flood APIs).
 * We use Open-Meteo's flood API as a proxy for global flood monitoring.
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 * @returns {Promise<Object>} Object containing river_discharge
 */
async function getFloodData(lat, lon) {
    try {
        // Note: Open-Meteo flood API requires a bounding box or specific points.
        // We will fetch daily river_discharge to simulate the flood API
        const response = await axios.get('https://flood-api.open-meteo.com/v1/flood', {
            params: {
                latitude: lat,
                longitude: lon,
                daily: 'river_discharge',
                forecast_days: 1
            }
        });

        const daily = response.data.daily;
        return {
            river_level: daily.river_discharge && daily.river_discharge.length > 0 ? daily.river_discharge[0] : 0
        };
    } catch (error) {
        console.error(`❌ Error fetching flood data for ${lat}, ${lon}:`, error.message);
        // Fallback to mock data if API fails or location is unsupported
        return { river_level: (Math.random() * 5).toFixed(2) };
    }
}

module.exports = { getFloodData };
