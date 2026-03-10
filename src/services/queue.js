const Queue = require('bull');

// Determine Redis connection
// Render provides REDIS_URL (or REDIS_INTERNAL_URL for internal communication)
const redisConfig = process.env.REDIS_URL
    ? process.env.REDIS_URL.replace('redis://', 'rediss://') // Force TLS for Upstash
    : {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
    };

// Create the alert queue
const alertQueue = new Queue('alert-queue', redisConfig, {
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
    },
});

// Log connection status
alertQueue.on('error', (error) => {
    console.error('Queue error:', error);
});

alertQueue.on('ready', () => {
    console.log('Queue connected to Redis');
});

/**
 * Add an alert job to the queue
 * @param {Object} alertData - Alert details
 * @returns {Promise<Job>} - The created job
 */
const addAlertToQueue = async (alertData) => {
    const job = await alertQueue.add('send-alert', alertData, {
        priority: alertData.severity === 'CRITICAL' ? 1 : 2,
    });
    console.log(`Alert job ${job.id} added to queue`);
    return job;
};

module.exports = {
    alertQueue,
    addAlertToQueue,
};
