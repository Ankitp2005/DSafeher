const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
);

/**
 * Authentication Middleware
 * Verifies JWT Access Token and attaches user to request
 */
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_ACCESS_SECRET;

        if (!secret) {
            console.error('JWT_ACCESS_SECRET missing');
            return res.status(500).json({ error: 'Internal server error' });
        }

        const decoded = jwt.verify(token, secret);

        // Optional: Check if user still exists/active in DB
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.user_id)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is disabled' });
        }

        req.user = user;
        req.deviceId = decoded.device_id;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'token_expired' });
        }
        console.error('Auth Middleware Error:', err.message);
        return res.status(401).json({ error: 'Invalid session' });
    }
};

module.exports = authMiddleware;
