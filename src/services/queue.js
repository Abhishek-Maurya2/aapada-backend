const Queue = require('bull');

// Determine Redis connection
const redisConfig = process.env.REDIS_URL
    ? process.env.REDIS_URL.replace('redis://', 'rediss://') // Force TLS for Upstash
    : {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
    };

let alertQueue = null;
let queueReady = false;

// Lazy init: only create the queue when needed
function getQueue() {
    if (alertQueue) return alertQueue;

    try {
        alertQueue = new Queue('alert-queue', redisConfig, {
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
                removeOnComplete: 100,
                removeOnFail: 50,
            },
        });

        alertQueue.on('ready', () => {
            queueReady = true;
            console.log('Queue connected to Redis');
        });

        alertQueue.on('error', (error) => {
            queueReady = false;
            console.error('Queue error:', error.message);
        });

        return alertQueue;
    } catch (err) {
        console.error('Failed to create queue:', err.message);
        return null;
    }
}

/**
 * Add an alert job to the queue
 * Falls back gracefully if Redis is unavailable
 */
const addAlertToQueue = async (alertData) => {
    const queue = getQueue();
    if (!queue) {
        console.warn('Queue unavailable, skipping job');
        return null;
    }
    try {
        const job = await queue.add('send-alert', alertData, {
            priority: alertData.severity === 'CRITICAL' ? 1 : 2,
        });
        console.log(`Alert job ${job.id} added to queue`);
        return job;
    } catch (err) {
        console.error('Failed to add job to queue:', err.message);
        return null;
    }
};

/**
 * Get queue status with a timeout guard (for serverless)
 */
const getQueueStatus = async (timeoutMs = 3000) => {
    const queue = getQueue();
    if (!queue) {
        return { waiting: 0, active: 0, completed: 0, failed: 0 };
    }

    try {
        const result = await Promise.race([
            Promise.all([
                queue.getWaitingCount(),
                queue.getActiveCount(),
                queue.getCompletedCount(),
                queue.getFailedCount(),
            ]),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Queue status timeout')), timeoutMs)
            ),
        ]);

        const [waiting, active, completed, failed] = result;
        return { waiting, active, completed, failed };
    } catch (err) {
        console.warn('Queue status unavailable:', err.message);
        return { waiting: 0, active: 0, completed: 0, failed: 0 };
    }
};

module.exports = {
    get alertQueue() { return getQueue(); },
    addAlertToQueue,
    getQueueStatus,
};

