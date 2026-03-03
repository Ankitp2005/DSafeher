const express = require('express');
const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
const twilioService = require('../services/twilioService');

const router = express.Router();

// Initialize Supabase
const supabase = createSupabaseClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { generateOTP, verifyOTP, validatePhoneNumber } = require('../services/otpService');
const {
    generateAccessToken,
    generateRefreshToken,
    rotateRefreshToken,
    revokeAllUserTokens,
    revokeDeviceToken
} = require('../services/tokenService');

// 1. POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
    try {
        const { phone_number } = req.body;
        if (!phone_number) {
            return res.status(400).json({ error: 'phone_number is required' });
        }

        const normalizedPhone = validatePhoneNumber(phone_number);
        const otp = await generateOTP(normalizedPhone);

        // Send via Twilio (Production)
        await twilioService.sendOTP(normalizedPhone, otp);

        return res.json({ success: true, expires_in: 600 });
    } catch (error) {
        console.error('Error in send-otp:', error.message);
        // Generic error message for security
        return res.status(error.message.includes('Too many') ? 429 : 400).json({
            error: error.message || 'Failed to send OTP'
        });
    }
});

// 2. POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
    try {
        const { phone_number, otp, device_id, device_name } = req.body;

        if (!phone_number || !otp) {
            return res.status(400).json({ error: 'phone_number and otp are required' });
        }

        const normalizedPhone = validatePhoneNumber(phone_number);
        await verifyOTP(normalizedPhone, otp);

        let isNewUser = false;
        let userId;

        // Fetch/Create user
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('phone_number', normalizedPhone)
            .single();

        if (!user) {
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert([{ phone_number: normalizedPhone, full_name: device_name || 'New User' }])
                .select()
                .single();

            if (createError) throw createError;
            userId = newUser.id;
            isNewUser = true;
        } else {
            userId = user.id;
        }

        // Issue token pair
        const accessToken = generateAccessToken({ user_id: userId, phone: normalizedPhone, device_id });
        const { refreshToken } = await generateRefreshToken(userId, device_id);

        return res.json({
            success: true,
            is_new_user: isNewUser,
            access_token: accessToken,
            refresh_token: refreshToken,
            user: { id: userId, phone_number: normalizedPhone }
        });

    } catch (error) {
        console.error('Error in verify-otp:', error.message);
        return res.status(401).json({ error: error.message || 'Invalid or expired OTP' });
    }
});

// 3. POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
    try {
        const { refresh_token, user_id, device_id } = req.body;

        if (!refresh_token || !user_id) {
            return res.status(400).json({ error: 'refresh_token and user_id required' });
        }

        const { accessToken, refreshToken } = await rotateRefreshToken(refresh_token, user_id, device_id);

        return res.json({
            success: true,
            access_token: accessToken,
            refresh_token: refreshToken
        });
    } catch (error) {
        console.error('Error in refresh:', error.message);
        return res.status(401).json({ error: 'Session expired. Please login again.' });
    }
});

// 4. POST /api/auth/logout
router.post('/logout', async (req, res) => {
    try {
        const { user_id, device_id } = req.body;
        if (user_id && device_id) {
            await revokeDeviceToken(user_id, device_id);
        }
        return res.json({ success: true });
    } catch (error) {
        console.error('Error in logout:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// 5. POST /api/auth/logout-all
router.post('/logout-all', async (req, res) => {
    try {
        const { user_id } = req.body;
        if (user_id) {
            await revokeAllUserTokens(user_id);
        }
        return res.json({ success: true });
    } catch (error) {
        console.error('Error in logout-all:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
