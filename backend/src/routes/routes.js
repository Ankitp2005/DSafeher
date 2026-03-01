const express = require('express');
const routeService = require('../services/routeService');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();
const supabase = createClient(
    process.env.SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
);

// Get route suggestions sorted by Safety instead of Speed
router.post('/suggest', async (req, res) => {
    try {
        const { origin_lat, origin_lng, destination_lat, destination_lng } = req.body;

        if (!origin_lat || !destination_lat) {
            return res.status(400).json({ error: 'Origin and destination are required' });
        }

        // 1. Mock Google Directions API Response
        // In production: fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=...&alternatives=true`)
        const mockGoogleRoutes = [
            { id: 'route_A', summary: 'Main Highway Route', distance: '5.2 km', duration: '15 mins', polyline: '...' },
            { id: 'route_B', summary: 'Side Streets (Shortest)', distance: '4.8 km', duration: '14 mins', polyline: '...' },
            { id: 'route_C', summary: 'Well-lit Promenade', distance: '6.5 km', duration: '18 mins', polyline: '...' }
        ];

        // 2. Score routes using our engine
        const scoredRoutes = await routeService.calculateSafetyScore(mockGoogleRoutes, new Date());

        res.json({ success: true, routes: scoredRoutes });
    } catch (error) {
        console.error('Error in route suggestions:', error);
        res.status(500).json({ error: 'Failed to calculate safe routes' });
    }
});

// Start tracking a journey/check-in
router.post('/journey/start', async (req, res) => {
    try {
        // const userId = req.user.id;
        const { destination_name, expected_arrival_at } = req.body;

        const { data: checkIn, error } = await supabase
            .from('check_ins')
            .insert([{
                // user_id: userId,
                destination_name,
                expected_arrival_at,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, journey_id: checkIn.id });
    } catch (error) {
        res.status(500).json({ error: 'Failed to start journey' });
    }
});

// End journey successfully
router.post('/journey/end', async (req, res) => {
    try {
        const { journey_id } = req.body;

        await supabase
            .from('check_ins')
            .update({ status: 'checked_in' })
            .eq('id', journey_id);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to end journey' });
    }
});

module.exports = router;
