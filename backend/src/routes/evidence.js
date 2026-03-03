const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const supabase = createClient(
    process.env.SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
);

// Configure multer for file uploads
const upload = multer({
    dest: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads/evidence/'),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const authMiddleware = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads/evidence/');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// POST /api/evidence/audio/:alertId
router.post('/audio/:alertId', authMiddleware, upload.single('audio'), async (req, res) => {
    try {
        const { alertId } = req.params;
        const file = req.file;
        const userId = req.user.id;

        // Verify alert belongs to user
        const { data: alert, error: fetchError } = await supabase
            .from('sos_alerts')
            .select('user_id')
            .eq('id', alertId)
            .single();

        if (fetchError || !alert || alert.user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized: Alert not found or does not belong to you.' });
        }

        if (!file) {
            return res.status(400).json({ error: 'No audio file uploaded.' });
        }

        console.log(`Received audio evidence for alert ${alertId}:`, file.originalname);

        // Record metadata in database
        const { error } = await supabase
            .from('evidence_logs')
            .insert([{
                alert_id: alertId,
                file_type: 'audio',
                file_path: file.path,
                original_name: file.originalname,
                recorded_at: new Date()
            }]);

        if (error) {
            console.error('DB Error inserting evidence:', error);
        }

        res.status(201).json({ success: true, message: 'Audio evidence uploaded securely.' });
    } catch (error) {
        console.error('Error uploading audio evidence:', error);
        res.status(500).json({ error: 'Failed to process audio evidence.' });
    }
});

// POST /api/evidence/photo/:alertId
router.post('/photo/:alertId', authMiddleware, upload.single('photo'), async (req, res) => {
    try {
        const { alertId } = req.params;
        const file = req.file;
        const userId = req.user.id;

        // Verify alert belongs to user
        const { data: alert, error: fetchError } = await supabase
            .from('sos_alerts')
            .select('user_id')
            .eq('id', alertId)
            .single();

        if (fetchError || !alert || alert.user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized: Alert not found or does not belong to you.' });
        }

        if (!file) {
            return res.status(400).json({ error: 'No photo file uploaded.' });
        }

        console.log(`Received photo evidence for alert ${alertId}:`, file.originalname);

        const { error } = await supabase
            .from('evidence_logs')
            .insert([{
                alert_id: alertId,
                file_type: 'photo',
                file_path: file.path,
                original_name: file.originalname,
                recorded_at: new Date()
            }]);

        if (error) {
            console.error('DB Error inserting evidence:', error);
        }

        res.status(201).json({ success: true, message: 'Photo evidence uploaded securely.' });
    } catch (error) {
        console.error('Error uploading photo evidence:', error);
        res.status(500).json({ error: 'Failed to process photo evidence.' });
    }
});

module.exports = router;
