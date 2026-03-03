const crypto = require('crypto');
const { parsePhoneNumberFromString } = require('libphonenumber-js');
const { redisClient } = require('../config/redis');

const OTP_EXPIRY = 600; // 10 minutes
const MAX_ATTEMPTS = 3;
const MAX_REQUESTS_PER_HOUR = 5;

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

    // Check request count for rate limiting
    const requestCountKey = `otp:requests:${normalizedPhone}`;
    const requests = await redisClient.get(requestCountKey);

    if (requests && parseInt(requests) >= MAX_REQUESTS_PER_HOUR) {
        throw new Error('Too many OTP requests. Please try again in 1 hour.');
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    // Store OTP
    await redisClient.setEx(`otp:${normalizedPhone}`, OTP_EXPIRY, otp);

    // Reset attempt count
    await redisClient.del(`otp:attempts:${normalizedPhone}`);

    // Increment request count
    if (!requests) {
        await redisClient.setEx(requestCountKey, 3600, "1");
    } else {
        await redisClient.incr(requestCountKey);
    }

    return otp;
}

/**
 * Verifies OTP and handles attempt tracking
 */
async function verifyOTP(phone, userOtp) {
    const normalizedPhone = validatePhoneNumber(phone);
    const otpKey = `otp:${normalizedPhone}`;
    const attemptKey = `otp:attempts:${normalizedPhone}`;

    const storedOtp = await redisClient.get(otpKey);

    if (!storedOtp) {
        throw new Error('OTP expired or not requested');
    }

    if (storedOtp !== userOtp) {
        const attempts = await redisClient.incr(attemptKey);
        await redisClient.expire(attemptKey, OTP_EXPIRY);

        if (attempts >= MAX_ATTEMPTS) {
            await redisClient.del(otpKey);
            await redisClient.del(attemptKey);
            throw new Error('Too many wrong attempts. Please request a new OTP.');
        }

        throw new Error('Invalid OTP');
    }

    // Success - delete OTP immediately (single use)
    await redisClient.del(otpKey);
    await redisClient.del(attemptKey);

    return true;
}

module.exports = {
    generateOTP,
    verifyOTP,
    validatePhoneNumber
};
