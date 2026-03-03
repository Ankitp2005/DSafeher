const request = require('supertest');
const express = require('express');

// Mock supabase
jest.mock('@supabase/supabase-js', () => {
    return {
        createClient: jest.fn(() => ({
            from: jest.fn(() => ({
                insert: jest.fn(() => {
                    const mockPromise = Promise.resolve({ data: { id: 'report-123' }, error: null });
                    const mockResult = {
                        select: jest.fn(() => {
                            const selectResult = {
                                single: jest.fn(() => mockPromise),
                                then: (cb) => mockPromise.then(cb)
                            };
                            return selectResult;
                        }),
                        then: (cb) => mockPromise.then(cb)
                    };
                    return mockResult;
                }),
                update: jest.fn(() => ({
                    eq: jest.fn(() => Promise.resolve({ error: null }))
                })),
                select: jest.fn(() => {
                    const mockChain = {
                        eq: jest.fn().mockReturnThis(),
                        gt: jest.fn().mockReturnThis(),
                        order: jest.fn().mockReturnThis(),
                        then: jest.fn((callback) => {
                            return Promise.resolve({ data: [{ id: 'report-123', incident_type: 'harassment' }], error: null }).then(callback);
                        })
                    };
                    return mockChain;
                })
            })),
            rpc: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
    };
});

// Mock auth middleware
jest.mock('../src/middleware/auth', () => (req, res, next) => {
    req.user = { id: 'test-user-uuid' };
    next();
});

jest.mock('../src/services/moderationService', () => ({
    moderateReport: jest.fn(() => Promise.resolve({ requiresAdminReview: false }))
}));

describe('Community Reporting Parameter Tests', () => {
    let reportsRoutes;
    let app;

    beforeAll(() => {
        jest.resetModules();
        reportsRoutes = require('../src/routes/reports');
        app = express();
        app.use(express.json());
        app.use('/api/reports', reportsRoutes);
    });

    const reportScenarios = [
        { type: 'harassment', lat: 19.0, lng: 72.0, anon: true, expected: 201 },
        { type: 'poor_lighting', lat: 19.1, lng: 72.1, anon: false, expected: 201 },
        { type: '', lat: 19.0, lng: 72.0, anon: true, expected: 400 }, // No type
        { type: 'harassment', lat: 120, lng: 72.0, anon: true, expected: 400 }, // Invalid lat
        { type: 'harassment', lat: 19.0, lng: 200, anon: true, expected: 400 }, // Invalid lng
    ];

    test.each(reportScenarios)('POST /api/reports with type=$type, lat=$lat, lng=$lng, anon=$anon', async ({ type, lat, lng, anon, expected }) => {
        const response = await request(app)
            .post('/api/reports')
            .set('Authorization', 'Bearer dummy')
            .send({
                incident_type: type,
                latitude: lat,
                longitude: lng,
                is_anonymous: anon,
                description: 'Test incident description'
            });

        expect(response.status).toBe(expected);
    });

    test('GET /api/reports/map should work with bounds', async () => {
        const response = await request(app)
            .get('/api/reports/map?lat=19.0&lng=72.0&radius=5000')
            .set('Authorization', 'Bearer dummy');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.reports)).toBe(true);
    });

    test('POST /api/reports/:id/upvote should increment weight', async () => {
        const response = await request(app)
            .post('/api/reports/report-123/upvote')
            .set('Authorization', 'Bearer dummy');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});
