const { alertQueue } = require('../services/queue');
const { processAlert } = require('../services/alertService');

// Process alert jobs
alertQueue.process('send-alert', 5, async (job) => {
    console.log(`Processing job ${job.id}: ${job.name || 'send-alert'}`);
    const { alertId } = job.data;

    try {
        const result = await processAlert(alertId);
        console.log(`Job ${job.id} completed:`, result);
        return result;
    } catch (error) {
        console.error(`Job ${job.id} failed:`, error.message);
        throw error;
    }
});

alertQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed with result:`, result);
});

alertQueue.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with error:`, err.message);
});

alertQueue.on('error', (err) => {
    console.error('Queue error:', err);
});

console.log('Alert worker started and listening for jobs...');

module.exports = alertQueue;
