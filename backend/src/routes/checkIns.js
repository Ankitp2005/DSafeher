const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const authMiddleware = require('../middleware/auth');

const router = express.Router();
const supabase = createClient(
    process.env.SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
);

// POST /api/check-ins
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { destination_name, expected_arrival_at, check_in_window_minutes, notifyContacts } = req.body;
        const userId = req.user.id;

        // Validation
        if (!destination_name || !expected_arrival_at || !check_in_window_minutes) {
            return res.status(400).json({ error: 'Missing required fields: destination_name, expected_arrival_at, and check_in_window_minutes are mandatory.' });
        }

        if (typeof check_in_window_minutes !== 'number' || check_in_window_minutes <= 0) {
            return res.status(400).json({ error: 'check_in_window_minutes must be a positive number.' });
        }

        const { data: checkIn, error } = await supabase
            .from('check_ins')
            .insert([{
                user_id: userId,
                destination_name,
                expected_arrival_at,
                check_in_window_minutes,
                status: 'pending',
                contacts_to_notify: notifyContacts,
                created_at: new Date()
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, checkInId: checkIn.id, trackingUrl: `https://safeher.app/track/${checkIn.id}` });
    } catch (error) {
        console.error('Error creating check-in:', error);
        res.status(500).json({ error: 'Failed to create check-in.' });
    }
});

// PUT /api/check-ins/:id/arrived
router.put('/:id/arrived', authMiddleware, async (req, res) => {
    try {
        const checkInId = req.params.id;
        const userId = req.user.id;

        // Verify ownership
        const { data: existing } = await supabase.from('check_ins').select('user_id').eq('id', checkInId).single();
        if (!existing || existing.user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { error } = await supabase
            .from('check_ins')
            .update({ status: 'checked_in' })
            .eq('id', checkInId);

        if (error) throw error;

        res.json({ success: true, message: 'Check-in confirmed. Contacts notified (simulated).' });
    } catch (error) {
        console.error('Error confirming check-in:', error);
        res.status(500).json({ error: 'Failed to confirm check-in.' });
    }
});

// PUT /api/check-ins/:id/extend
router.put('/:id/extend', async (req, res) => {
    try {
        const checkInId = req.params.id;
        const { additionalMinutes } = req.body;

        if (!additionalMinutes || typeof additionalMinutes !== 'number') {
            return res.status(400).json({ error: 'Invalid additional minutes provided' });
        }

        // Fetch current check in
        const { data: currentCheckIn, error: fetchError } = await supabase
            .from('check_ins')
            .select('expected_arrival_at')
            .eq('id', checkInId)
            .single();

        if (fetchError || !currentCheckIn) {
            throw fetchError || new Error('CheckIn not found');
        }

        const currentArrival = new Date(currentCheckIn.expected_arrival_at);
        const newArrival = new Date(currentArrival.getTime() + additionalMinutes * 60000);

        const { error } = await supabase
            .from('check_ins')
            .update({ expected_arrival_at: newArrival })
            .eq('id', checkInId);

        if (error) {
            throw error;
        }

        // Ideally here you update the scheduled alert job to the new time and notify contacts of extension

        res.json({ success: true, message: `Check-in extended by ${additionalMinutes} minutes. Contacts notified (simulated).`, newArrivalAt: newArrival });
    } catch (error) {
        console.error('Error extending check-in:', error);
        res.status(500).json({ error: 'Failed to extend check-in.' });
    }
});

// POST /api/check-ins/:id/trigger-alert (simulated call by scheduler)
router.post('/:id/trigger-alert', async (req, res) => {
    try {
        const checkInId = req.params.id;

        const { error } = await supabase
            .from('check_ins')
            .update({ status: 'missed' })
            .eq('id', checkInId);

        if (error) {
            throw error;
        }

        // Trigger Twilio SMS and Push Notification to selected contacts here

        res.json({ success: true, message: 'Alert triggered for missed check-in! Contacts notified (simulated).' });
    } catch (error) {
        console.error('Error triggering check-in alert:', error);
        res.status(500).json({ error: 'Failed to trigger alert.' });
    }
});

// GET /api/check-ins/history
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: checkIns, error } = await supabase
            .from('check_ins')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, checkIns });
    } catch (error) {
        console.error('Error fetching check-in history:', error);
        res.status(500).json({ error: 'Failed to fetch check-in history.' });
    }
});

// DELETE /api/check-ins/:id
router.delete('/:id', async (req, res) => {
    try {
        const checkInId = req.params.id;

        const { error } = await supabase
            .from('check_ins')
            .update({ status: 'cancelled' })
            .eq('id', checkInId);

        if (error) {
            throw error;
        }

        res.json({ success: true, message: 'Check-in cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling check-in:', error);
        res.status(500).json({ error: 'Failed to cancel check-in.' });
    }
});

module.exports = router;
