const request = require('supertest');
const express = require('express');

// Mock supabase before requiring routes
jest.mock('@supabase/supabase-js', () => {
    return {
        createClient: jest.fn(() => ({
            from: jest.fn(() => ({
                insert: jest.fn(() => ({
                    select: jest.fn(() => ({
                        single: jest.fn().mockImplementation(() => {
                            return Promise.resolve({ data: { id: 'sos-123', status: 'active' }, error: null });
                        })
                    }))
                })),
                update: jest.fn(() => ({
                    eq: jest.fn(() => Promise.resolve({ data: [{ id: 'sos-123' }], error: null }))
                })),
                select: jest.fn(() => {
                    const mockChain = {
                        eq: jest.fn().mockReturnThis(),
                        order: jest.fn().mockReturnThis(),
                        limit: jest.fn().mockReturnThis(),
                        single: jest.fn().mockImplementation(() => Promise.resolve({ data: { id: 'sos-123', status: 'active', user_id: 'test-user-uuid' }, error: null })),
                        then: jest.fn().mockImplementation((callback) => {
                            return Promise.resolve({ data: [{ id: 'sos-123', trigger_type: 'button', user_id: 'test-user-uuid' }], error: null }).then(callback);
                        })
                    };
                    return mockChain;
                })
            }))
        }))
    };
});

// Mock twilio
jest.mock('twilio', () => {
    return jest.fn(() => ({
        messages: {
            create: jest.fn(() => Promise.resolve({ sid: 'test_sms' }))
        }
    }));
});

// Mock auth middleware
jest.mock('../src/middleware/auth', () => (req, res, next) => {
    req.user = { id: 'test-user-uuid', user_metadata: { full_name: 'Test User' } };
    next();
});

const sosRoutes = require('../src/routes/sos');

const app = express();
app.use(express.json());
app.use('/api/sos', sosRoutes);

describe('SOS System Parameter Tests', () => {

    // Test parameters for SOS Triggers
    const triggerScenarios = [
        { type: 'button', expectedStatus: 200 },
        { type: 'shake', expectedStatus: 200 },
        { type: 'voice', expectedStatus: 200 },
        { type: 'fake_call_triggered', expectedStatus: 200 },
        { type: '', expectedStatus: 400 }, // Invalid empty
    ];

    test.each(triggerScenarios)('POST /api/sos/trigger with $type parameter', async ({ type, expectedStatus }) => {
        const response = await request(app)
            .post('/api/sos/trigger')
            .set('Authorization', 'Bearer dummy_token')
            .send({ trigger_type: type, latitude: 19.0, longitude: 72.0 });

        expect(response.status).toBe(expectedStatus);
        if (expectedStatus === 200) {
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('alert_id', 'sos-123');
        } else {
            expect(response.body).toHaveProperty('error');
        }
    });

    test('POST /api/sos/trigger missing coordinates', async () => {
        const response = await request(app)
            .post('/api/sos/trigger')
            .set('Authorization', 'Bearer dummy_token')
            .send({ trigger_type: 'button' });
        // Although location is optional, the system should still accept it and create the alert
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
    });

    // Test updating SOS location
    const locationScenarios = [
        { lat: 19.5, lng: 72.5, expect: 200 },
        { lat: -95.0, lng: 72.5, expect: 400 }, // Invalid latitude
        { lat: 19.5, lng: -190.0, expect: 400 }, // Invalid longitude
        { lat: 'bad', lng: 'data', expect: 400 }, // NaN 
    ];

    test.each(locationScenarios)('POST /api/sos/:id/location with lat=$lat, lng=$lng', async ({ lat, lng, expect: expectedStatus }) => {
        const response = await request(app)
            .post('/api/sos/sos-123/location')
            .set('Authorization', 'Bearer dummy_token')
            .send({ latitude: lat, longitude: lng, accuracy: 10, battery_level: 80 });

        expect(response.status).toBe(expectedStatus);
    });

    test('PUT /api/sos/:id/resolve correctly finishes SOS', async () => {
        const response = await request(app)
            .put('/api/sos/sos-123/resolve')
            .set('Authorization', 'Bearer dummy_token');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('GET /api/sos/active/status returns active status', async () => {
        const response = await request(app)
            .get('/api/sos/active/status')
            .set('Authorization', 'Bearer dummy_token');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.active).toBe(true);
    });
});
