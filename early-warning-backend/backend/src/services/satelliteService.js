/**
 * Mock service for NASA rainfall satellite data.
 * In a real application, this would interface with NASA's Global Precipitation Measurement (GPM) APIs.
 */

async function getSatelliteRainfall(lat, lon) {
    // Simulate satellite data for rainfall intensity and cloud cover
    const simulatedPrecipitationRate = Math.random() < 0.3 ? (Math.random() * 50).toFixed(2) : 0; // mm/hr
    const simulatedCloudCover = Math.floor(Math.random() * 100); // percentage

    return {
        satellite_precipitation_rate: parseFloat(simulatedPrecipitationRate),
        cloud_cover: simulatedCloudCover,
        timestamp: new Date().toISOString()
    };
}

module.exports = { getSatelliteRainfall };
