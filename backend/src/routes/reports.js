const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const moderationService = require('../services/moderationService');
const dangerZoneService = require('../services/dangerZoneService');

const authMiddleware = require('../middleware/auth');

const router = express.Router();

const supabase = createClient(
    process.env.SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
);

// Get incidents for rendering map
router.get('/map', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('community_reports')
            .select('*')
            .gt('expires_at', new Date().toISOString());

        if (error) throw error;

        res.json({ success: true, reports: data });
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve reports' });
    }
});

// Post an incident
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            incident_type, description, latitude, longitude,
            photo_url, is_anonymous
        } = req.body;
        const userId = req.user.id;

        if (!incident_type) {
            return res.status(400).json({ error: 'incident_type is required' });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({ error: 'Invalid coordinates' });
        }

        const moderationResult = await moderationService.moderateReport(req.body);
        if (moderationResult.requiresAdminReview) {
            return res.json({ success: true, message: 'Report queued for moderation review.' });
        }

        const expiresAt = new Date();
        if (['assault', 'harassment'].includes(incident_type)) {
            expiresAt.setDate(expiresAt.getDate() + 30);
        } else {
            expiresAt.setDate(expiresAt.getDate() + 7);
        }

        const reportedBy = is_anonymous ? null : userId;

        const { data, error } = await supabase
            .from('community_reports')
            .insert([{
                reported_by_user_id: reportedBy,
                incident_type,
                description,
                latitude,
                longitude,
                photo_url,
                is_anonymous,
                is_verified: false,
                expires_at: expiresAt.toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        // Optionally, recalculate danger zones if a dense area of incidents is detected
        dangerZoneService.recalculateZones();

        res.status(201).json({ success: true, message: 'Report submitted successfully', report_id: data.id });
    } catch (err) {
        console.error('Error handling report:', err);
        res.status(500).json({ error: 'Failed to create report' });
    }
});

// Get incidents for rendering heatmap density
router.get('/heatmap', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('community_reports')
            .select('latitude, longitude, incident_type')
            .gt('expires_at', new Date().toISOString());

        if (error) throw error;

        // Density data logic on client side usually, but we can return tailored data here
        res.json({ success: true, reports: data });
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve heatmap data' });
    }
});

// Upvote an incident report
router.post('/:id/upvote', authMiddleware, async (req, res) => {
    try {
        const reportId = req.params.id;
        const userId = req.user.id;

        // 1. Check if user already upvoted (needs a report_upvotes table)
        // 2. Increment upvote_count
        const { error } = await supabase.rpc('increment_report_upvote', { row_id: reportId });

        if (error) throw error;

        res.json({ success: true, message: 'Report upvoted.' });
    } catch (err) {
        console.error('Error upvoting report:', err);
        res.status(500).json({ error: 'Failed to upvote report' });
    }
});

// Dismiss an incident report (flag as inaccurate)
router.post('/:id/dismiss', authMiddleware, async (req, res) => {
    try {
        const reportId = req.params.id;
        // In reality, log the dismissal and if dismissals > upvotes, flag for moderation
        res.json({ success: true, message: 'Report dismissed.' });
    } catch (err) {
        console.error('Error dismissing report:', err);
        res.status(500).json({ error: 'Failed to dismiss report' });
    }
});

module.exports = router;
