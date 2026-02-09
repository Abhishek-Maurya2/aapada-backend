const Redis = require('ioredis');

const redisConnection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null, // Required for BullMQ
});

redisConnection.on('connect', () => {
    console.log('Redis Connected');
});

redisConnection.on('error', (err) => {
    console.error('Redis Error:', err);
});

module.exports = redisConnection;
