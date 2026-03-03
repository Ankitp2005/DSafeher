const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

/**
 * Generates an Access Token
 */
function generateAccessToken(payload) {
    if (!process.env.JWT_ACCESS_SECRET) {
        throw new Error('JWT_ACCESS_SECRET is not defined');
    }
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Generates a Refresh Token and stores its hash
 */
async function generateRefreshToken(userId, deviceId, tokenFamily = null) {
    if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error('JWT_REFRESH_SECRET is not defined');
    }

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const family = tokenFamily || crypto.randomUUID();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    // Store in Supabase (we'll need a refresh_tokens table)
    const { error } = await supabase
        .from('refresh_tokens')
        .insert([{
            user_id: userId,
            token_hash: hashedToken,
            device_id: deviceId,
            token_family: family,
            expires_at: expiresAt.toISOString()
        }]);

    if (error) throw error;

    return { refreshToken, family };
}

/**
 * Verifies a refresh token and handles rotation/revocation
 */
async function rotateRefreshToken(oldRefreshToken, userId, deviceId) {
    const hashedOldToken = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');

    // Find the token in DB
    const { data: tokenRecord, error: fetchError } = await supabase
        .from('refresh_tokens')
        .select('*')
        .eq('token_hash', hashedOldToken)
        .single();

    if (fetchError || !tokenRecord) {
        throw new Error('Invalid or expired refresh token');
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
        await revokeTokenFamily(tokenRecord.token_family);
        throw new Error('Refresh token expired');
    }

    if (tokenRecord.is_revoked) {
        // REPLAY ATTACK DETECTED
        // Invalidate entire family for security
        await revokeTokenFamily(tokenRecord.token_family);
        throw new Error('Security breach detected: Refresh token already used');
    }

    // Invalidate old token
    await supabase
        .from('refresh_tokens')
        .update({ is_revoked: true })
        .eq('id', tokenRecord.id);

    // Generate new pair
    const userData = { user_id: userId, device_id: deviceId }; // Minimal payload
    const accessToken = generateAccessToken(userData);
    const { refreshToken, family } = await generateRefreshToken(userId, deviceId, tokenRecord.token_family);

    return { accessToken, refreshToken };
}

async function revokeTokenFamily(tokenFamily) {
    await supabase
        .from('refresh_tokens')
        .update({ is_revoked: true })
        .eq('token_family', tokenFamily);
}

async function revokeAllUserTokens(userId) {
    await supabase
        .from('refresh_tokens')
        .update({ is_revoked: true })
        .eq('user_id', userId);
}

async function revokeDeviceToken(userId, deviceId) {
    await supabase
        .from('refresh_tokens')
        .update({ is_revoked: true })
        .eq('user_id', userId)
        .eq('device_id', deviceId);
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    rotateRefreshToken,
    revokeAllUserTokens,
    revokeDeviceToken
};
