const axios = require('axios');

/**
 * Fetches recent significant earthquakes from USGS API.
 * Returns quakes in the last hour.
 * @returns {Promise<Array>} List of earthquake objects
 */
async function getRecentEarthquakes() {
    try {
        // Fetch all earthquakes in the past hour
        const response = await axios.get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson');
        
        const features = response.data.features || [];
        
        return features.map(f => ({
            id: f.id,
            magnitude: f.properties.mag,
            place: f.properties.place,
            time: new Date(f.properties.time),
            latitude: f.geometry.coordinates[1],
            longitude: f.geometry.coordinates[0],
            depth: f.geometry.coordinates[2]
        }));
    } catch (error) {
        console.error(`❌ Error fetching earthquake data:`, error.message);
        throw error;
    }
}

module.exports = { getRecentEarthquakes };
