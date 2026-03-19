const pool = require('../config/db');

const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Locations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                district VARCHAR(100),
                state VARCHAR(100)
            );
        `);
        console.log('✅ Locations table created');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS Sensors (
                id SERIAL PRIMARY KEY,
                location_id INTEGER REFERENCES Locations(id),
                sensor_type VARCHAR(50) NOT NULL,
                status VARCHAR(50) DEFAULT 'ACTIVE',
                installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Sensors table created');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS EnvironmentalData (
                id SERIAL PRIMARY KEY,
                location_id INTEGER REFERENCES Locations(id),
                sensor_id INTEGER REFERENCES Sensors(id),
                rainfall DECIMAL(10, 2),
                temperature DECIMAL(5, 2),
                humidity DECIMAL(5, 2),
                wind_speed DECIMAL(5, 2),
                soil_moisture DECIMAL(5, 2),
                river_level DECIMAL(10, 2),
                vegetation_dryness DECIMAL(5, 2),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ EnvironmentalData table created');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS RiskPredictions (
                id SERIAL PRIMARY KEY,
                location_id INTEGER REFERENCES Locations(id),
                risk_score DECIMAL(5, 2),
                flood_probability DECIMAL(5, 2),
                landslide_probability DECIMAL(5, 2),
                storm_surge_probability DECIMAL(5, 2),
                risk_level VARCHAR(50),
                predicted_time_window VARCHAR(100),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ RiskPredictions table created');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS Alerts (
                id SERIAL PRIMARY KEY,
                location_id INTEGER REFERENCES Locations(id),
                alert_type VARCHAR(50),
                severity VARCHAR(50),
                message TEXT,
                sent_to TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Alerts table created');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS CommunityReports (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(100),
                disaster_type VARCHAR(50),
                image_url TEXT,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                ai_confidence DECIMAL(5, 2),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ CommunityReports table created');

        console.log('🎉 All tables initialized successfully.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Error initializing database', err);
        process.exit(1);
    }
};

initDb();
