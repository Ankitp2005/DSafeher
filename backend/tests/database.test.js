/**
 * Database Security & Integrity Tests
 * Tests encryption round-trip, cleanup logic, and service layer
 */

// Mock ioredis to prevent Redis connection attempts
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        on: jest.fn(), get: jest.fn(), setEx: jest.fn(),
        del: jest.fn(), incr: jest.fn(), expire: jest.fn(),
        connect: jest.fn(), quit: jest.fn(), isReady: true
    }));
});

// Mock Prisma Client
const mockPrisma = {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    emergencyContact: { findMany: jest.fn(), create: jest.fn() },
    sosAlert: { create: jest.fn(), update: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
    locationTracking: { create: jest.fn(), findFirst: jest.fn(), deleteMany: jest.fn() },
    communityReport: { create: jest.fn(), findMany: jest.fn(), deleteMany: jest.fn() },
    dangerZone: { deleteMany: jest.fn() },
    checkIn: { create: jest.fn(), update: jest.fn() },
    refreshToken: { deleteMany: jest.fn() },
    auditLog: { create: jest.fn(), deleteMany: jest.fn() },
    safePlace: { upsert: jest.fn() },
    $executeRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
    $on: jest.fn(),
    $disconnect: jest.fn()
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma)
}));

// Mock Supabase (used by some services)
jest.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(), update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
    })
}));

const { encrypt, decrypt } = require('../src/utils/encryption');
const { dailyCleanup, weeklyCleanup } = require('../src/jobs/dataCleanup');

describe('Database Security & Integrity Tests', () => {

    beforeAll(() => {
        process.env.ENCRYPTION_KEY = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';
        process.env.SUPABASE_URL = 'http://mock.supabase.co';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_key';
        process.env.JWT_ACCESS_SECRET = 'test_secret_64chars_long_enough_for_verification_test_suite_here';
        process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_64_chars_long_enough_for_test_here_padding';
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── ENCRYPTION TESTS ───

    describe('Field Encryption (AES-256-GCM)', () => {
        test('Encryption round trip succeeds', () => {
            const address = '123 Safety Lane, New Delhi, 110001';
            const encrypted = encrypt(address);

            expect(encrypted).toBeDefined();
            expect(encrypted.startsWith('v1:')).toBe(true);
            expect(encrypted).not.toContain(address);

            const decrypted = decrypt(encrypted);
            expect(decrypted).toBe(address);
        });

        test('Different encryptions produce different ciphertexts (unique IV)', () => {
            const text = 'Repeat me';
            const enc1 = encrypt(text);
            const enc2 = encrypt(text);

            expect(enc1).not.toBe(enc2);
            expect(decrypt(enc1)).toBe(text);
            expect(decrypt(enc2)).toBe(text);
        });

        test('Null input returns null', () => {
            expect(encrypt(null)).toBeNull();
            expect(decrypt(null)).toBeNull();
        });

        test('Tampered ciphertext fails integrity check', () => {
            const encrypted = encrypt('secret data');
            const parts = encrypted.split(':');
            // Tamper with ciphertext portion
            parts[3] = 'AAAA' + parts[3].substring(4);
            const tampered = parts.join(':');

            expect(() => decrypt(tampered)).toThrow('Data decryption failed');
        });

        test('Missing ENCRYPTION_KEY throws error', () => {
            const original = process.env.ENCRYPTION_KEY;
            delete process.env.ENCRYPTION_KEY;
            expect(() => encrypt('test')).toThrow();
            process.env.ENCRYPTION_KEY = original;
        });
    });

    // ─── DATA CLEANUP TESTS ───

    describe('Data Cleanup Jobs', () => {
        test('Daily cleanup deletes old records from all tables', async () => {
            mockPrisma.locationTracking.deleteMany.mockResolvedValue({ count: 50 });
            mockPrisma.communityReport.deleteMany.mockResolvedValue({ count: 5 });
            mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 10 });
            mockPrisma.auditLog.deleteMany.mockResolvedValue({ count: 3 });

            const results = await dailyCleanup();

            expect(results.locationTracking).toBe(50);
            expect(results.expiredReports).toBe(5);
            expect(results.refreshTokens).toBe(10);
            expect(results.auditLogs).toBe(3);
        });

        test('Weekly cleanup compresses resolved SOS alerts', async () => {
            mockPrisma.dangerZone.deleteMany.mockResolvedValue({ count: 2 });
            mockPrisma.sosAlert.findMany.mockResolvedValue([
                { id: 'alert-1' }, { id: 'alert-2' }
            ]);
            mockPrisma.locationTracking.deleteMany.mockResolvedValue({ count: 200 });

            const results = await weeklyCleanup();

            expect(results.compressedLocations).toBe(200);
            expect(mockPrisma.locationTracking.deleteMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { sosAlertId: { in: ['alert-1', 'alert-2'] } }
                })
            );
        });

        test('Cleanup handles errors gracefully without crashing', async () => {
            mockPrisma.locationTracking.deleteMany.mockRejectedValue(new Error('DB down'));
            mockPrisma.communityReport.deleteMany.mockResolvedValue({ count: 0 });
            mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
            mockPrisma.auditLog.deleteMany.mockResolvedValue({ count: 0 });

            const results = await dailyCleanup();
            // Should continue even after first error
            expect(results.expiredReports).toBe(0);
        });
    });

    // ─── SERVICE LAYER TESTS ───

    describe('Database Service Layer', () => {
        const databaseService = require('../src/services/databaseService');

        test('getUserById decrypts addresses', async () => {
            const homeEnc = encrypt('123 Home St');
            const workEnc = encrypt('456 Work Ave');
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-1',
                homeAddressEncrypted: homeEnc,
                workAddressEncrypted: workEnc
            });

            const user = await databaseService.getUserById('user-1');

            expect(user.homeAddress).toBe('123 Home St');
            expect(user.workAddress).toBe('456 Work Ave');
            expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalled();
        });

        test('createUser encrypts addresses before storage', async () => {
            mockPrisma.user.create.mockImplementation((args) => Promise.resolve(args.data));

            const result = await databaseService.createUser({
                phoneNumber: '+919876543210',
                fullName: 'Test User',
                homeAddress: 'Private Home'
            });

            expect(result.homeAddressEncrypted).toBeDefined();
            expect(result.homeAddressEncrypted.startsWith('v1:')).toBe(true);
            expect(result.homeAddress).toBeUndefined();
        });

        test('createSosAlert writes audit log', async () => {
            mockPrisma.sosAlert.create.mockResolvedValue({ id: 'sos-1' });
            mockPrisma.auditLog.create.mockResolvedValue({});

            await databaseService.createSosAlert('user-1', {
                triggerType: 'BUTTON',
                latitude: 28.6139,
                longitude: 77.2090
            });

            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        action: 'SOS_TRIGGERED',
                        userId: 'user-1'
                    })
                })
            );
        });

        test('createReport anonymizes userId when anonymous', async () => {
            mockPrisma.communityReport.create.mockImplementation((args) => Promise.resolve(args.data));

            const result = await databaseService.createReport('user-1', {
                incidentType: 'HARASSMENT',
                latitude: 28.61, longitude: 77.20,
                isAnonymous: true
            });

            expect(result.reportedByUserId).toBeNull();
        });

        test('getReportsInArea enforces pagination limit', async () => {
            mockPrisma.communityReport.findMany.mockResolvedValue([]);

            await databaseService.getReportsInArea({
                swLat: 28.5, swLng: 77.1, neLat: 28.7, neLng: 77.3
            });

            expect(mockPrisma.communityReport.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ take: 200 })
            );
        });
    });
});
