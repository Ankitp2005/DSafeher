const request = require('supertest');
const express = require('express');

// Mock supabase before requiring routes
jest.mock('@supabase/supabase-js', () => {
    return {
        createClient: jest.fn(() => ({
            from: jest.fn(() => ({
                insert: jest.fn(() => ({
                    select: jest.fn(() => ({
                        single: jest.fn(() => Promise.resolve({ data: { id: 'test_report_id' }, error: null }))
                    }))
                })),
                select: jest.fn(() => ({
                    gt: jest.fn(() => Promise.resolve({ data: [{ id: '1', incident_type: 'harassment' }], error: null }))
                }))
            }))
        }))
    };
});

// Mock auth middleware
jest.mock('../src/middleware/auth', () => (req, res, next) => {
    req.user = { id: 'test-user-uuid' };
    next();
});

const reports = require('../src/routes/reports');

const app = express();
app.use(express.json());
app.use('/api/reports', reports);

describe('Reports API', () => {
    it('GET /api/reports/map should return active reports', async () => {
        const response = await request(app)
            .get('/api/reports/map')
            .set('Authorization', 'Bearer dummy');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.reports.length).toBeGreaterThan(0);
        expect(response.body.reports[0].id).toBe('1');
    });

    it('POST /api/reports should create a report', async () => {
        const response = await request(app)
            .post('/api/reports')
            .set('Authorization', 'Bearer dummy')
            .send({
                incident_type: 'suspicious_activity',
                latitude: 19.0760,
                longitude: 72.8777,
                is_anonymous: true
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.report_id).toBe('test_report_id');
    });

    it('POST /api/reports should require missing fields', async () => {
        const response = await request(app)
            .post('/api/reports')
            .set('Authorization', 'Bearer dummy')
            .send({
                description: 'test'
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('incident_type is required');
    });

    it('POST /api/reports handles moderation correctly', async () => {
        const response = await request(app)
            .post('/api/reports')
            .set('Authorization', 'Bearer dummy')
            .send({
                incident_type: 'suspicious_activity',
                description: 'this is a spam_trigger report',
                latitude: 19.0760,
                longitude: 72.8777,
                photo_url: 'http://example.com/photo.jpg',
                is_anonymous: true
            });

        // Assuming moderation service flags "spam_trigger" in description
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Report queued for moderation review.');
    });
});
