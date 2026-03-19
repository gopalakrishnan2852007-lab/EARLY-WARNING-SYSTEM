const axios = require('axios');

/* ======================================================
   SENTINELALERT — Earthquake Service
   Source: USGS Earthquake Hazards Program (Free API)
====================================================== */

// Tamil Nadu bounding box
const TN_BOUNDS = {
    minLat: 7.9,
    maxLat: 13.6,
    minLng: 76.2,
    maxLng: 80.4,
};

// ── Filter for Tamil Nadu region ───────────────────────
function isInTamilNadu(lat, lng) {
    return (
        lat >= TN_BOUNDS.minLat && lat <= TN_BOUNDS.maxLat &&
        lng >= TN_BOUNDS.minLng && lng <= TN_BOUNDS.maxLng
    );
}

// ── Severity from magnitude ────────────────────────────
function getMagnitudeSeverity(mag) {
    if (mag >= 6.0) return 'critical';
    if (mag >= 4.5) return 'high';
    if (mag >= 3.0) return 'moderate';
    return 'safe';
}

/* ── Fetch Recent Earthquakes (past hour) ─────────────── */
async function getRecentEarthquakes() {
    try {
        const response = await axios.get(
            'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
            { timeout: 8000 }
        );

        const features = response.data.features || [];

        return features.map(f => ({
            id: f.id,
            magnitude: f.properties.mag,
            place: f.properties.place,
            time: new Date(f.properties.time),
            latitude: f.geometry.coordinates[1],
            longitude: f.geometry.coordinates[0],
            depth: f.geometry.coordinates[2],
            severity: getMagnitudeSeverity(f.properties.mag),
            inTamilNadu: isInTamilNadu(
                f.geometry.coordinates[1],
                f.geometry.coordinates[0]
            ),
        }));

    } catch (error) {
        console.error('❌ Earthquake API Error:', error.message);
        throw error;
    }
}

/* ── Fetch Tamil Nadu Earthquakes Only ────────────────── */
async function getTamilNaduEarthquakes() {
    try {
        const all = await getRecentEarthquakes();
        const tnQuakes = all.filter(q => q.inTamilNadu);

        if (tnQuakes.length > 0) {
            console.log(`🌍 SentinelAlert: ${tnQuakes.length} earthquake(s) detected near Tamil Nadu`);
        }

        return tnQuakes;
    } catch (error) {
        console.error('❌ TN Earthquake fetch failed:', error.message);
        return [];
    }
}

/* ── Get significant quakes (mag >= 4.0) ─────────────── */
async function getSignificantEarthquakes() {
    try {
        const response = await axios.get(
            'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_day.geojson',
            { timeout: 8000 }
        );

        const features = response.data.features || [];

        return features.map(f => ({
            id: f.id,
            magnitude: f.properties.mag,
            place: f.properties.place,
            time: new Date(f.properties.time),
            latitude: f.geometry.coordinates[1],
            longitude: f.geometry.coordinates[0],
            depth: f.geometry.coordinates[2],
            severity: getMagnitudeSeverity(f.properties.mag),
            url: f.properties.url,
        }));

    } catch (error) {
        console.error('❌ Significant earthquake fetch failed:', error.message);
        return [];
    }
}

module.exports = {
    getRecentEarthquakes,
    getTamilNaduEarthquakes,
    getSignificantEarthquakes,
};