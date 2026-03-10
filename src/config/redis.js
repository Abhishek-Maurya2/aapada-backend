const Redis = require('ioredis');

// Support full REDIS_URL or individual host/port parts
const redisUrl = process.env.REDIS_URL;

const redisConnection = redisUrl
    ? new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        tls: redisUrl.startsWith('rediss') ? {} : undefined,
    })
    : new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        maxRetriesPerRequest: null,
    });

redisConnection.on('connect', () => {
    console.log('Redis Connected');
});

redisConnection.on('error', (err) => {
    console.error('Redis Error:', err);
});

module.exports = redisConnection;
