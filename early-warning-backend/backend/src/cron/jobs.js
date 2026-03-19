const cron = require('node-cron');
const { fetchEnvironmentalData } = require('../services/dataIngestionService');

// Schedule job to run every 5 minutes
const startCronJobs = () => {
    console.log('🕒 Starting cron jobs...');

    cron.schedule('*/5 * * * *', async () => {
        console.log('⏰ Running 5-minute environmental data ingestion job...');
        await fetchEnvironmentalData();
    });
};

module.exports = { startCronJobs };
