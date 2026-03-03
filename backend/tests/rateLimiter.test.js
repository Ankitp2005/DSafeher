const request = require('supertest');
const express = require('express');
const { otpLimiter, sosLimiter, globalLimiter } = require('../src/middleware/rateLimiter');
const { getUseRedis } = require('../src/config/redis');

describe('Rate Limiter Security Tests', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.set('trust proxy', 1); // Important for rate limiting
        app.use(express.json());

        // Mock a simple route for global tests
        // Use a much lower limit for the test globally to avoid long loops
        const globalTestLimiter = globalLimiter;
        app.get('/test-global', globalTestLimiter, (req, res) => res.json({ ok: true }));

        // OTP route
        app.post('/api/auth/send-otp', otpLimiter, (req, res) => res.json({ sent: true }));

        // SOS route
        app.post('/api/sos/trigger', sosLimiter, (req, res) => res.json({ triggered: true }));
    });

    test('OTP Limiter blocks after 5 requests from same IP/Phone', async () => {
        const testPhone = `PROD_TEST_${Date.now()}`;
        const testIP = `10.0.0.${Math.floor(Math.random() * 254) + 1}`;

        // Send 5 successful requests
        for (let i = 0; i < 5; i++) {
            await request(app)
                .post('/api/auth/send-otp')
                .set('X-Forwarded-For', testIP)
                .send({ phone: testPhone })
                .expect(200);
        }

        // 6th request should be blocked
        const response = await request(app)
            .post('/api/auth/send-otp')
            .set('X-Forwarded-For', testIP)
            .send({ phone: testPhone })
            .expect(429);

        expect(response.body.error).toBe('rate_limit_exceeded');
    });

    test('SOS Limiter blocks after 10 requests but provides specific message', async () => {
        for (let i = 0; i < 10; i++) {
            await request(app)
                .post('/api/sos/trigger')
                .expect(200);
        }

        const response = await request(app)
            .post('/api/sos/trigger')
            .expect(429);

        expect(response.body.message).toContain('call 112');
    });

    test('Global Limiter blocks unauthenticated burst', async () => {
        // We limit to 30/min for unauth. Let's burst 31.
        // For testing purposes, we might want to lower this in test env or just loop.
        const promises = [];
        for (let i = 0; i < 30; i++) {
            promises.push(request(app).get('/test-global'));
        }
        await Promise.all(promises);

        await request(app)
            .get('/test-global')
            .expect(429);
    });

    test('Redis fallback check', () => {
        const isUsingRedis = getUseRedis();
        console.log(`Test environment is using Redis for rate limiting: ${isUsingRedis}`);
        // This is a sanity check. In a CI, we'd expect this to be false if Redis is missing.
    });
});
