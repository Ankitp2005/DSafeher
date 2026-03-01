const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { createClient } = require('redis');
const twilioService = require('../services/twilioService');
const { createClient: createSupabaseClient } = require('@supabase/supabase-js');

const router = express.Router();

// Initialize Redis 
const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.on('error', err => console.error('Redis Client Error', err));
redisClient.connect().catch(console.error);

// Initialize Supabase
const supabase = createSupabaseClient(
    process.env.SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
);

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key';

// 1. POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
    try {
        const { phone_number } = req.body;
        if (!phone_number) {
            return res.status(400).json({ error: 'phone_number is required' });
        }

        // TODO: Validate international phone format
        // TODO: Rate limiting

        const otp = crypto.randomInt(100000, 999999).toString();

        // Store in Redis with 10-minute TTL (600 seconds)
        await redisClient.setEx(`otp:${phone_number}`, 600, otp);

        // Send via Twilio
        await twilioService.sendOTP(phone_number, otp);

        return res.json({ success: true, expires_in: 600 });
    } catch (error) {
        console.error('Error in send-otp:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
    try {
        const { phone_number, otp } = req.body;

        if (!phone_number || !otp) {
            return res.status(400).json({ error: 'phone_number and otp are required' });
        }

        const storedOtp = await redisClient.get(`otp:${phone_number}`);

        if (!storedOtp || storedOtp !== otp) {
            return res.status(401).json({ error: 'Invalid or expired OTP' });
        }

        // Single use OTP
        await redisClient.del(`otp:${phone_number}`);

        // Check if user exists in Supabase
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('phone_number', phone_number)
            .single();

        let isNewUser = false;
        let userId;

        if (!user) {
            // Create new user
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert([{ phone_number, full_name: 'New User' }])
                .select()
                .single();

            if (createError) throw createError;
            userId = newUser.id;
            isNewUser = true;
        } else {
            userId = user.id;
        }

        // Issue JWT
        const accessToken = jwt.sign({ userId, phone_number }, JWT_SECRET, { expiresIn: '24h' });
        const refreshToken = crypto.randomBytes(40).toString('hex');

        // Store refresh token with 30-day TTL (2592000 seconds)
        await redisClient.setEx(`refresh:${userId}`, 2592000, refreshToken);

        // TODO: Log in audit_logs

        return res.json({
            success: true,
            is_new_user: isNewUser,
            access_token: accessToken,
            refresh_token: refreshToken,
            user: { id: userId, phone_number }
        });

    } catch (error) {
        console.error('Error in verify-otp:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
    try {
        const { refresh_token, user_id } = req.body;

        if (!refresh_token || !user_id) {
            return res.status(400).json({ error: 'refresh_token and user_id required' });
        }

        const storedToken = await redisClient.get(`refresh:${user_id}`);

        if (!storedToken || storedToken !== refresh_token) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        // Issue new access token
        const accessToken = jwt.sign({ userId: user_id }, JWT_SECRET, { expiresIn: '24h' });

        return res.json({ success: true, access_token: accessToken });
    } catch (error) {
        console.error('Error in refresh:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// 4. POST /api/auth/logout
router.post('/logout', async (req, res) => {
    try {
        const { user_id } = req.body;
        if (user_id) {
            await redisClient.del(`refresh:${user_id}`);
        }
        return res.json({ success: true });
    } catch (error) {
        console.error('Error in logout:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
