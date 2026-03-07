const crypto = require('crypto');
const { parsePhoneNumberFromString } = require('libphonenumber-js');
const { redisClient, getUseRedis } = require('../config/redis');

const OTP_EXPIRY = 600; // 10 minutes
const MAX_ATTEMPTS = 3;
const MAX_REQUESTS_PER_HOUR = 5;

// ─── In-memory fallback store when Redis is unavailable ───
const memoryStore = new Map();
const memoryTimers = new Map();

function memSet(key, value, ttlSeconds) {
    console.log(`[MEM_DEBUG] SET: ${key} = ${value} (TTL: ${ttlSeconds}s)`);
    memoryStore.set(key, value);
    // Auto-expire
    if (memoryTimers.has(key)) clearTimeout(memoryTimers.get(key));
    memoryTimers.set(key, setTimeout(() => {
        console.log(`[MEM_DEBUG] EXPIRED: ${key}`);
        memoryStore.delete(key);
        memoryTimers.delete(key);
    }, ttlSeconds * 1000));
}

function memGet(key) {
    const val = memoryStore.get(key) || null;
    console.log(`[MEM_DEBUG] GET: ${key} = ${val}`);
    return val;
}

function memDel(key) {
    memoryStore.delete(key);
    if (memoryTimers.has(key)) {
        clearTimeout(memoryTimers.get(key));
        memoryTimers.delete(key);
    }
}

function memIncr(key) {
    const val = parseInt(memoryStore.get(key) || '0') + 1;
    memoryStore.set(key, val.toString());
    return val;
}

// ─── Storage helpers (Redis with in-memory fallback) ───
async function storeGet(key) {
    try {
        if (getUseRedis()) {
            return await redisClient.get(key);
        }
    } catch (e) { /* fall through */ }
    return memGet(key);
}

async function storeSetEx(key, ttl, value) {
    try {
        if (getUseRedis()) {
            await redisClient.setex(key, ttl, value);
            return;
        }
    } catch (e) { /* fall through */ }
    memSet(key, value, ttl);
}

async function storeDel(key) {
    try {
        if (getUseRedis()) {
            await redisClient.del(key);
            return;
        }
    } catch (e) { /* fall through */ }
    memDel(key);
}

async function storeIncr(key) {
    try {
        if (getUseRedis()) {
            return await redisClient.incr(key);
        }
    } catch (e) { /* fall through */ }
    return memIncr(key);
}

async function storeExpire(key, ttl) {
    try {
        if (getUseRedis()) {
            await redisClient.expire(key, ttl);
            return;
        }
    } catch (e) { /* fall through */ }
    // For memory store, re-set the timer
    const val = memGet(key);
    if (val !== null) memSet(key, val, ttl);
}

// ─── Public API ───

/**
 * Validates phone number format (E.164)
 */
function validatePhoneNumber(phoneNumber) {
    const parsed = parsePhoneNumberFromString(phoneNumber);
    if (!parsed || !parsed.isValid()) {
        throw new Error('Invalid phone number format. Use E.164 (e.g., +919876543210)');
    }
    return parsed.format('E.164');
}

/**
 * Generates a cryptographically secure 6-digit OTP
 */
async function generateOTP(phone) {
    const normalizedPhone = validatePhoneNumber(phone);

    // Check request count for rate limiting (DISABLED FOR DEV)
    /*
    const requestCountKey = `otp:requests:${normalizedPhone}`;
    const requests = await storeGet(requestCountKey);

    if (requests && parseInt(requests) >= MAX_REQUESTS_PER_HOUR) {
        throw new Error('Too many OTP requests. Please try again in 1 hour.');
    }
    */

    // Hardcoded OTP for development as requested
    const otp = '123456';
    // const otp = crypto.randomInt(100000, 999999).toString();

    // Store OTP
    await storeSetEx(`otp:${normalizedPhone}`, OTP_EXPIRY, otp);

    // Reset attempt count
    await storeDel(`otp:attempts:${normalizedPhone}`);

    /*
    // Increment request count
    if (!requests) {
        await storeSetEx(requestCountKey, 3600, "1");
    } else {
        await storeIncr(requestCountKey);
    }
    */

    return otp;
}

/**
 * Verifies OTP and handles attempt tracking
 */
async function verifyOTP(phone, userOtp) {
    const normalizedPhone = validatePhoneNumber(phone);
    const otpKey = `otp:${normalizedPhone}`;
    const attemptKey = `otp:attempts:${normalizedPhone}`;

    const storedOtp = await storeGet(otpKey);

    if (!storedOtp) {
        throw new Error('OTP expired or not requested');
    }

    if (storedOtp !== String(userOtp)) {
        const attempts = await storeIncr(attemptKey);
        await storeExpire(attemptKey, OTP_EXPIRY);

        if (attempts >= MAX_ATTEMPTS) {
            await storeDel(otpKey);
            await storeDel(attemptKey);
            throw new Error('Too many wrong attempts. Please request a new OTP.');
        }

        throw new Error('Invalid OTP');
    }

    // Success - delete OTP immediately (single use)
    await storeDel(otpKey);
    await storeDel(attemptKey);

    return true;
}

module.exports = {
    generateOTP,
    verifyOTP,
    validatePhoneNumber
};

