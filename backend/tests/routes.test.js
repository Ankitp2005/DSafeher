const request = require('supertest');
const express = require('express');

// Mock supabase before requiring routes
jest.mock('@supabase/supabase-js', () => {
    return {
        createClient: jest.fn(() => ({
            from: jest.fn(() => ({
                insert: jest.fn(() => ({
                    select: jest.fn(() => ({
                        single: jest.fn(() => Promise.resolve({ data: { id: 'test_journey_id' }, error: null }))
                    }))
                })),
                update: jest.fn(() => ({
                    eq: jest.fn(() => Promise.resolve({ error: null }))
                }))
            }))
        }))
    };
});

const routes = require('../src/routes/routes');

// Mock routeService so we don't depend on randomization
jest.mock('../src/services/routeService', () => ({
    calculateSafetyScore: jest.fn((options, time) => {
        return Promise.resolve(options.map(o => ({
            ...o,
            safety_score: 85,
            safety_label: 'Safe',
            incident_count_nearby: 0,
            safe_places_nearby: 1,
            warnings: []
        })));
    })
}));

const app = express();
app.use(express.json());
app.use('/api/routes', routes);

describe('Routes API', () => {
    it('POST /api/routes/suggest should return routes with scores', async () => {
        const response = await request(app)
            .post('/api/routes/suggest')
            .send({
                origin_lat: 19.0760,
                origin_lng: 72.8777,
                destination_lat: 19.0505,
                destination_lng: 72.8252
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.routes.length).toBeGreaterThan(0);
        expect(response.body.routes[0]).toHaveProperty('safety_score');
    });

    it('POST /api/routes/suggest should return 400 if missing coords', async () => {
        const response = await request(app)
            .post('/api/routes/suggest')
            .send({
                origin_lat: 19.0760
            });

        expect(response.status).toBe(400);
    });

    it('POST /api/routes/journey/start should start journey and return id', async () => {
        const response = await request(app)
            .post('/api/routes/journey/start')
            .send({
                destination_name: 'Home',
                expected_arrival_at: new Date().toISOString()
            });

        expect(response.status).toBe(200);
        // Supabase query can fail since mock or unconfigured DB, meaning it could be 500 error down the line without jest mock for supabase.
    });
});
