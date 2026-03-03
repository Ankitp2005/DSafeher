const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const authenticateToken = require('../middleware/auth');

const supabase = createClient(
    process.env.SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
);

/**
 * @route POST /api/guardian/invite
 * @desc Invite a contact to be a guardian
 */
router.post('/invite', authenticateToken, async (req, res) => {
    const { contactId, relationship } = req.body;
    const userId = req.user.id;

    if (!contactId) {
        return res.status(400).json({ error: 'Contact identity is required' });
    }

    try {
        // Check if contact exists and belongs to user
        const { data: contact, error: contactError } = await supabase
            .from('emergency_contacts')
            .select('*')
            .eq('id', contactId)
            .eq('user_id', userId)
            .single();

        if (contactError || !contact) {
            return res.status(404).json({ error: 'Emergency contact not found' });
        }

        // Create or update guardian relationship
        const { data, error } = await supabase
            .from('guardians')
            .upsert({
                user_id: userId,
                contact_id: contactId,
                relationship: relationship || 'Trusted Contact',
                status: 'pending',
                invited_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        // In a real app, this would trigger an SMS/Push via Twilio/FCM
        res.json({
            message: 'Guardian invitation sent (Mock)',
            guardian: data
        });
    } catch (error) {
        console.error('Invite Guardian Error:', error);
        res.status(500).json({ error: 'Failed to send guardian invitation' });
    }
});

/**
 * @route GET /api/guardian/monitored
 * @desc List people this user is guarding
 */
router.get('/monitored', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const phone = req.user.phone;

    try {
        // Find relationships where the current user's phone matches a guardian's contact info
        // This assumes we link by phone number since guardians might not have accounts yet
        const { data, error } = await supabase
            .from('guardians')
            .select(`
                id,
                status,
                relationship,
                user:user_id (
                    id,
                    full_name,
                    phone
                )
            `)
            .eq('contact_phone', phone) // Assumes we added this field to schema
            .eq('status', 'accepted');

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Monitored Users Error:', error);
        res.status(500).json({ error: 'Failed to fetch monitored users' });
    }
});

/**
 * @route GET /api/guardian/status/:userId
 * @desc Get real-time status of a monitored user
 */
router.get('/status/:monitoredUserId', authenticateToken, async (req, res) => {
    const guardianId = req.user.id;
    const { monitoredUserId } = req.params;

    try {
        // Verify relationship exists and is accepted
        const { data: relationship, error: relError } = await supabase
            .from('guardians')
            .select('*')
            .eq('user_id', monitoredUserId)
            .eq('guardian_id', guardianId)
            .eq('status', 'accepted')
            .single();

        if (relError || !relationship) {
            return res.status(403).json({ error: 'You are not a guardian for this user' });
        }

        // Get user's active SOS or last known location
        const { data: userStatus, error: statusError } = await supabase
            .rpc('get_user_safety_status', { target_user_id: monitoredUserId });

        if (statusError) throw statusError;
        res.json(userStatus);
    } catch (error) {
        console.error('User Status Error:', error);
        res.status(500).json({ error: 'Failed to fetch user status' });
    }
});

module.exports = router;
