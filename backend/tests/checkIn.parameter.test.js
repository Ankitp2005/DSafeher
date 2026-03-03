const request = require('supertest');
const express = require('express');

// Mock supabase
jest.mock('@supabase/supabase-js', () => {
    return {
        createClient: jest.fn(() => ({
            from: jest.fn(() => ({
                insert: jest.fn(() => ({
                    select: jest.fn(() => ({
                        single: jest.fn(() => Promise.resolve({ data: { id: 'checkin-123', status: 'pending' }, error: null }))
                    }))
                })),
                select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        order: jest.fn(() => Promise.resolve({ data: [{ id: 'checkin-123', status: 'pending' }], error: null })),
                        single: jest.fn(() => Promise.resolve({ data: { id: 'checkin-123', status: 'pending', user_id: 'test-user-uuid' }, error: null }))
                    }))
                })),
                update: jest.fn(() => ({
                    eq: jest.fn(() => Promise.resolve({ data: [{ id: 'checkin-123', status: 'checked_in' }], error: null }))
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

const checkInRoutes = require('../src/routes/checkIns');

const app = express();
app.use(express.json());
app.use('/api/check-ins', checkInRoutes);

describe('Check-In System Parameter Tests', () => {

    const checkInScenarios = [
        { dest: 'Home', window: 15, expected: 201 },
        { dest: 'Office', window: 45, expected: 201 },
        { dest: '', window: 15, expected: 400 }, // Missing destination
        { dest: 'Gym', window: -5, expected: 400 }, // Invalid window
        { dest: 'Gym', window: 'fast', expected: 400 }, // Invalid window type
    ];

    test.each(checkInScenarios)('POST /api/check-ins with dest=$dest, window=$window', async ({ dest, window, expected }) => {
        const response = await request(app)
            .post('/api/check-ins')
            .set('Authorization', 'Bearer dummy')
            .send({
                destination_name: dest,
                expected_arrival_at: new Date(Date.now() + 3600000).toISOString(),
                check_in_window_minutes: window
            });

        expect(response.status).toBe(expected);
    });

    test('GET /api/check-ins/history should return user check-ins', async () => {
        const response = await request(app)
            .get('/api/check-ins/history')
            .set('Authorization', 'Bearer dummy');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.checkIns)).toBe(true);
    });

    test('PUT /api/check-ins/:id/arrived should mark as safe', async () => {
        const response = await request(app)
            .put('/api/check-ins/checkin-123/arrived')
            .set('Authorization', 'Bearer dummy');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});
