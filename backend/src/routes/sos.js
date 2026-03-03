const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const twilioService = require('../services/twilioService');
const crypto = require('crypto');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const supabase = createClient(
    process.env.SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
);

router.post('/trigger', authMiddleware, async (req, res) => {
    try {
        const { trigger_type, latitude, longitude } = req.body;
        const userId = req.user.id;

        if (!trigger_type) {
            return res.status(400).json({ error: 'trigger_type is required' });
        }

        // Optional coordinate validation if provided
        if (latitude !== undefined || longitude !== undefined) {
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);
            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                return res.status(400).json({ error: 'Invalid coordinates' });
            }
        }

        // Create SOS alert
        const { data: alert, error: insertError } = await supabase
            .from('sos_alerts')
            .insert([{ user_id: userId, trigger_type, status: 'active' }])
            .select()
            .single();

        if (insertError) throw insertError;

        // Generate unique tracking token that expires in 6 hours
        const trackingToken = crypto.randomBytes(16).toString('hex');
        const trackingUrl = `https://safeher.app/track/${trackingToken}`;

        // Fetch Emergency Contacts
        const { data: contacts } = await supabase
            .from('emergency_contacts')
            .select('*')
            .eq('user_id', userId)
            .eq('notify_on_sos', true);

        const contactsNotified = [];
        if (contacts && contacts.length > 0) {
            // Send immediate SMS
            for (const contact of contacts) {
                try {
                    // Try to use real twilio service if configured
                    if (process.env.TWILIO_ACCOUNT_SID) {
                        await twilioService.sendSOS(contact.phone_number, req.user.user_metadata?.full_name || "SafeHer User", trackingUrl);
                        contactsNotified.push({ id: contact.id, status: 'delivered_sms' });
                    } else {
                        console.log(`[MOCK SMS] Sending to ${contact.name}: 🚨 EMERGENCY! Track here: ${trackingUrl}`);
                        contactsNotified.push({ id: contact.id, status: 'mock_delivered' });
                    }
                } catch (e) {
                    contactsNotified.push({ id: contact.id, status: 'failed_sms' });
                }
            }
        }

        // Update alert with contacts status
        await supabase.from('sos_alerts').update({
            contacts_notified: JSON.stringify(contactsNotified),
            tracking_token: trackingToken
        }).eq('id', alert.id);

        res.json({
            success: true,
            alert_id: alert.id,
            tracking_token: trackingToken,
            contacts_notified: contactsNotified
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to trigger SOS' });
    }
});

router.post('/:alert_id/location', authMiddleware, async (req, res) => {
    try {
        const { alert_id } = req.params;
        const { latitude, longitude, accuracy, battery_level } = req.body;
        const userId = req.user.id;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({ error: 'latitude and longitude are required' });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({ error: 'Invalid coordinates' });
        }

        // Verify alert belongs to user
        const { data: alert } = await supabase
            .from('sos_alerts')
            .select('user_id')
            .eq('id', alert_id)
            .single();

        if (!alert || alert.user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to update this alert' });
        }

        const { error } = await supabase
            .from('location_tracking')
            .insert([{
                sos_alert_id: alert_id,
                latitude,
                longitude,
                accuracy,
                battery_level
            }]);

        if (error) throw error;
        res.status(200).send({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Location update failed" });
    }
});

router.put('/:alert_id/resolve', authMiddleware, async (req, res) => {
    try {
        const { alert_id } = req.params;
        const userId = req.user.id;

        // Verify alert belongs to user
        const { data: alert } = await supabase
            .from('sos_alerts')
            .select('user_id')
            .eq('id', alert_id)
            .single();

        if (!alert || alert.user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to resolve this alert' });
        }

        await supabase
            .from('sos_alerts')
            .update({ status: 'resolved', resolved_at: new Date() })
            .eq('id', alert_id);

        // Notify contacts that user is safe
        const { data: contacts } = await supabase
            .from('emergency_contacts')
            .select('*')
            .eq('user_id', userId)
            .eq('notify_on_sos', true);

        const userName = req.user.user_metadata?.full_name || "SafeHer User";

        if (contacts && contacts.length > 0) {
            for (const contact of contacts) {
                try {
                    await twilioService.sendSafeNotification(contact.phone_number, userName);
                } catch (e) {
                    console.error(`Failed to send safe notification to ${contact.name}:`, e);
                }
            }
        }

        res.json({ success: true, status: 'resolved' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to resolve SOS" });
    }
});

router.get('/active/status', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data: alert, error } = await supabase
            .from('sos_alerts')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is 'no rows'

        res.json({
            success: true,
            active: !!alert,
            alert: alert || null
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch SOS status' });
    }
});

router.get('/:alert_id', authMiddleware, async (req, res) => {
    try {
        const { alert_id } = req.params;
        const userId = req.user.id;

        const { data: alert, error } = await supabase
            .from('sos_alerts')
            .select('*')
            .eq('id', alert_id)
            .single();

        if (error) throw error;
        if (!alert || alert.user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json(alert);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch alert' });
    }
});

module.exports = router;
