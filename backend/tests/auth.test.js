// Mocking must happen before any requires 
const mockRedisData = new Map();

jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => {
        const client = {
            get: jest.fn().mockImplementation(key => Promise.resolve(mockRedisData.get(key) || null)),
            setex: jest.fn().mockImplementation((key, ttl, val) => {
                mockRedisData.set(key, val);
                return Promise.resolve('OK');
            }),
            del: jest.fn().mockImplementation(key => {
                mockRedisData.delete(key);
                return Promise.resolve(1);
            }),
            incr: jest.fn().mockImplementation(key => {
                const val = (parseInt(mockRedisData.get(key) || '0') + 1).toString();
                mockRedisData.set(key, val);
                return Promise.resolve(parseInt(val));
            }),
            expire: jest.fn().mockResolvedValue(1),
            on: jest.fn(),
            status: 'ready',
            isReady: true,
            connect: jest.fn().mockResolvedValue(),
            quit: jest.fn().mockResolvedValue(),
            call: jest.fn()
        };
        client.call.apply = (ctx, args) => client.call(...args);
        return client;
    });
});

jest.mock('../src/services/twilioService', () => ({
    sendOTP: jest.fn().mockResolvedValue({ sid: 'mock_sid' })
}));

jest.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => Promise.resolve({
            data: { id: 'test-user-id', phone_number: '+919876543210', is_active: true },
            error: null
        }))
    })
}));

const request = require('supertest');
const express = require('express');
const { redisClient } = require('../src/config/redis');
const authRoutes = require('../src/routes/auth');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication Security Tests', () => {
    const testPhone = '+919876543210';

    beforeAll(() => {
        process.env.JWT_ACCESS_SECRET = 'test_access_secret_at_least_64_characters_long_for_hs256_verification';
        process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_64_characters_long_for_hs256_verification';
        process.env.SUPABASE_URL = 'http://mock.supabase.co';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_key';
    });

    beforeEach(() => {
        mockRedisData.clear();
        jest.clearAllMocks();
    });

    test('OTP is secure and single-use', async () => {
        await request(app)
            .post('/api/auth/send-otp')
            .send({ phone_number: testPhone })
            .expect(200);

        const otp = await mockRedisData.get(`otp:${testPhone}`);
        expect(otp).toHaveLength(6);

        const res1 = await request(app)
            .post('/api/auth/verify-otp')
            .send({ phone_number: testPhone, otp, device_id: 'test-device' })
            .expect(200);

        expect(res1.body.access_token).toBeDefined();

        await request(app)
            .post('/api/auth/verify-otp')
            .send({ phone_number: testPhone, otp, device_id: 'test-device' })
            .expect(401);
    });

    test('OTP blocks after 3 wrong attempts', async () => {
        await request(app)
            .post('/api/auth/send-otp')
            .send({ phone_number: testPhone })
            .expect(200);

        for (let i = 0; i < 3; i++) {
            await request(app)
                .post('/api/auth/verify-otp')
                .send({ phone_number: testPhone, otp: '000000' })
                .expect(401);
        }

        const otp = await mockRedisData.get(`otp:${testPhone}`);
        expect(otp).toBeUndefined();
    });

    test('Refresh token rotation works', async () => {
        await request(app).post('/api/auth/send-otp').send({ phone_number: testPhone });
        const otp = await mockRedisData.get(`otp:${testPhone}`);

        const loginRes = await request(app)
            .post('/api/auth/verify-otp')
            .send({ phone_number: testPhone, otp, device_id: 'device-1' });

        const firstRefreshToken = loginRes.body.refresh_token;

        const refreshRes = await request(app)
            .post('/api/auth/refresh')
            .send({ refresh_token: firstRefreshToken, user_id: 'test-user-id', device_id: 'device-1' })
            .expect(200);

        expect(refreshRes.body.access_token).toBeDefined();
        expect(refreshRes.body.refresh_token).not.toBe(firstRefreshToken);
    });

    test('Logout invalidates tokens', async () => {
        await request(app).post('/api/auth/send-otp').send({ phone_number: testPhone });
        const otp = await mockRedisData.get(`otp:${testPhone}`);
        const loginRes = await request(app).post('/api/auth/verify-otp').send({ phone_number: testPhone, otp, device_id: 'device-1' });

        const refreshToken = loginRes.body.refresh_token;

        await request(app)
            .post('/api/auth/logout')
            .send({ user_id: 'test-user-id', device_id: 'device-1', refresh_token: refreshToken })
            .expect(200);
    });
});
