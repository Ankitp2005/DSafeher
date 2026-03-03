const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
);

// Middleware to check admin role would go here...

router.get('/reports/pending', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('community_reports')
            .select('*')
            .eq('is_verified', false);

        if (error) throw error;
        res.json({ success: true, reports: data });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pending reports' });
    }
});

router.put('/reports/:id/verify', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('community_reports')
            .update({ is_verified: true })
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Report verified.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to verify report' });
    }
});

module.exports = router;
