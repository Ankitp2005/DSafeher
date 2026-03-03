const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient, getUseRedis } = require('../config/redis');

/**
 * Standardized rate limit error response
 */
const rateLimitHandler = (req, res, next, options) => {
    res.status(429).json({
        error: 'rate_limit_exceeded',
        message: options.message || 'Too many requests. Slow down.',
        retry_after_seconds: Math.ceil(options.windowMs / 1000),
        limit: options.limit,
        remaining: 0
    });
};

/**
 * Key generator: Prioritize user_id from JWT, fallback to IP
 */
const keyGenerator = (req) => {
    const key = req.user && req.user.id ? `ratelimit:user:${req.user.id}` : `ratelimit:ip:${req.ip}`;
    return key;
};

const createLimiter = (options) => {
    const isRedisEnabled = getUseRedis();

    const config = {
        windowMs: options.windowMs,
        max: options.limit, // Use 'max' for better compatibility across v6/v7/v8
        message: options.message,
        handler: rateLimitHandler,
        keyGenerator: options.keyGenerator || keyGenerator,
        standardHeaders: true,
        legacyHeaders: false,
        ...options.extra
    };

    if (isRedisEnabled) {
        config.store = new RedisStore({
            sendCommand: (...args) => redisClient.call(...args),
            prefix: options.prefix || 'rl:',
        });
    }

    return rateLimit(config);
};

// 1. Global Limiter: 200/min per user, 30/min per IP
const globalLimiter = createLimiter({
    windowMs: 60 * 1000,
    limit: (req) => (req.user ? 200 : 30),
    message: "Too many requests. Slow down.",
    prefix: 'rl:global:'
});

// 2. OTP Limiter: 3/hour per phone (in body), 5/hour per IP
const otpLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    message: "Too many OTP requests. Try again in 1 hour.",
    keyGenerator: (req) => `otp:${req.body.phone || req.ip}`,
    prefix: 'rl:otp:'
});

// 3. SOS Limiter: 10/hour per user
const sosLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    message: "SOS limit reached. If this is a real emergency call 112.",
    prefix: 'rl:sos:'
});

// 4. Report Limiter: 3/10min surge, 10/hour total
const reportLimiter = createLimiter({
    windowMs: 10 * 60 * 1000,
    limit: 3,
    message: "Report limit reached. Try again shortly.",
    prefix: 'rl:report:'
});

// 5. Route Limiter: 60/hour per user
const routeLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    limit: 60,
    message: "Route request limit reached.",
    prefix: 'rl:route:'
});

// 6. Auth Limiter: 10 failures/15min, lock for 30min
const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: "Too many login attempts. Try again in 30 minutes.",
    prefix: 'rl:auth:',
    extra: {
        skipSuccessfulRequests: true, // Only count failures
    }
});

module.exports = {
    globalLimiter,
    otpLimiter,
    sosLimiter,
    reportLimiter,
    routeLimiter,
    authLimiter
};
