const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const IS_TEST = process.env.NODE_ENV === 'test';

let redisClient;
let useRedis = false;

try {
    redisClient = new Redis(REDIS_URL, {
        retryStrategy: (times) => {
            if (times > 3) {
                console.error('Redis connection failed permanently after 3 retries. Falling back to in-memory store.');
                useRedis = false;
                return null; // stop retrying
            }
            return Math.min(times * 200, 2000);
        },
        maxRetriesPerRequest: 3
    });

    redisClient.on('connect', () => {
        console.log('Connected to Redis for rate limiting.');
        useRedis = true;
    });

    redisClient.on('error', (err) => {
        console.warn('Redis Connection Error:', err.message);
        useRedis = false;
    });
} catch (error) {
    console.warn('Failed to initialize Redis client. Falling back to memory.');
    useRedis = false;
}

module.exports = {
    redisClient,
    getUseRedis: () => useRedis
};
