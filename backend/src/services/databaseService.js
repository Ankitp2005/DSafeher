const { PrismaClient } = require('@prisma/client');
const { encrypt, decrypt } = require('../utils/encryption');

const prisma = new PrismaClient({
    log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' }
    ]
});

// Log slow queries (> 500ms)
prisma.$on('query', (e) => {
    if (e.duration > 500) {
        console.warn(`[SLOW QUERY] ${e.duration}ms: ${e.query}`);
    }
});

/**
 * Sets the RLS user context for Supabase/PostgreSQL
 * Must be called before any query that uses RLS policies
 */
async function setUserContext(userId) {
    if (userId) {
        await prisma.$executeRawUnsafe(
            `SELECT set_config('app.current_user_id', '${userId}', true)`
        );
    }
}

// ─── USER OPERATIONS ───

async function getUserById(userId) {
    await setUserContext(userId);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
        user.homeAddress = user.homeAddressEncrypted ? decrypt(user.homeAddressEncrypted) : null;
        user.workAddress = user.workAddressEncrypted ? decrypt(user.workAddressEncrypted) : null;
    }
    return user;
}

async function getUserByPhone(phone) {
    return prisma.user.findUnique({ where: { phoneNumber: phone } });
}

async function createUser(data) {
    const encrypted = {};
    if (data.homeAddress) {
        encrypted.homeAddressEncrypted = encrypt(data.homeAddress);
        delete data.homeAddress;
    }
    if (data.workAddress) {
        encrypted.workAddressEncrypted = encrypt(data.workAddress);
        delete data.workAddress;
    }
    return prisma.user.create({ data: { ...data, ...encrypted } });
}

async function updateUser(userId, data) {
    await setUserContext(userId);
    const encrypted = {};
    if (data.homeAddress !== undefined) {
        encrypted.homeAddressEncrypted = data.homeAddress ? encrypt(data.homeAddress) : null;
        delete data.homeAddress;
    }
    if (data.workAddress !== undefined) {
        encrypted.workAddressEncrypted = data.workAddress ? encrypt(data.workAddress) : null;
        delete data.workAddress;
    }
    return prisma.user.update({ where: { id: userId }, data: { ...data, ...encrypted } });
}

// ─── EMERGENCY CONTACTS ───

async function getEmergencyContacts(userId) {
    await setUserContext(userId);
    return prisma.emergencyContact.findMany({ where: { userId } });
}

async function addEmergencyContact(userId, data) {
    await setUserContext(userId);
    return prisma.emergencyContact.create({ data: { ...data, userId } });
}

// ─── SOS ALERTS ───

async function createSosAlert(userId, data) {
    await setUserContext(userId);
    const alert = await prisma.sosAlert.create({
        data: {
            userId,
            triggerType: data.triggerType,
            initialLatitude: data.latitude,
            initialLongitude: data.longitude,
            contactsNotified: data.contactsNotified || []
        }
    });

    // Audit log
    await createAuditLog(userId, 'SOS_TRIGGERED', {
        alertId: alert.id,
        triggerType: data.triggerType,
        latitude: data.latitude,
        longitude: data.longitude
    });

    return alert;
}

async function updateSosAlertStatus(alertId, status, userId) {
    await setUserContext(userId);
    const alert = await prisma.sosAlert.update({
        where: { id: alertId },
        data: {
            status,
            resolvedAt: ['RESOLVED', 'FALSE_ALARM', 'CANCELLED'].includes(status) ? new Date() : undefined
        }
    });

    await createAuditLog(userId, `SOS_${status}`, { alertId });
    return alert;
}

async function getActiveSosAlert(userId) {
    await setUserContext(userId);
    return prisma.sosAlert.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: { locations: { orderBy: { recordedAt: 'desc' }, take: 1 } }
    });
}

// ─── LOCATION TRACKING ───

async function addLocationPoint(alertId, userId, locationData) {
    await setUserContext(userId);
    return prisma.locationTracking.create({
        data: {
            sosAlertId: alertId,
            userId,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            accuracy: locationData.accuracy || 0,
            speed: locationData.speed,
            heading: locationData.heading,
            batteryLevel: locationData.batteryLevel
        }
    });
}

async function getLatestLocation(alertId) {
    return prisma.locationTracking.findFirst({
        where: { sosAlertId: alertId },
        orderBy: { recordedAt: 'desc' }
    });
}

// ─── COMMUNITY REPORTS ───

async function createReport(userId, data) {
    return prisma.communityReport.create({
        data: {
            reportedByUserId: data.isAnonymous ? null : userId,
            incidentType: data.incidentType,
            description: data.description?.substring(0, 500),
            latitude: data.latitude,
            longitude: data.longitude,
            photoUrl: data.photoUrl,
            isAnonymous: data.isAnonymous !== false,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days default
        }
    });
}

async function getReportsInArea(bounds) {
    return prisma.communityReport.findMany({
        where: {
            expiresAt: { gt: new Date() },
            latitude: { gte: bounds.swLat, lte: bounds.neLat },
            longitude: { gte: bounds.swLng, lte: bounds.neLng }
        },
        orderBy: { reportedAt: 'desc' },
        take: 200 // Prevent unbounded results
    });
}

// ─── CHECK-INS ───

async function createCheckIn(userId, data) {
    await setUserContext(userId);
    return prisma.checkIn.create({
        data: {
            userId,
            destinationName: data.destinationName,
            expectedArrivalAt: new Date(data.expectedArrivalAt),
            checkInWindowMinutes: data.checkInWindowMinutes || 15,
            contactsToNotify: data.contactsToNotify || []
        }
    });
}

async function resolveCheckIn(checkInId, status, userId) {
    await setUserContext(userId);
    return prisma.checkIn.update({
        where: { id: checkInId },
        data: { status }
    });
}

// ─── AUDIT LOGS ───

async function createAuditLog(userId, action, metadata, ipAddress = null) {
    return prisma.auditLog.create({
        data: { userId, action, metadata, ipAddress }
    });
}

// ─── CLEANUP ───

async function disconnect() {
    await prisma.$disconnect();
}

module.exports = {
    prisma,
    setUserContext,
    getUserById,
    getUserByPhone,
    createUser,
    updateUser,
    getEmergencyContacts,
    addEmergencyContact,
    createSosAlert,
    updateSosAlertStatus,
    getActiveSosAlert,
    addLocationPoint,
    getLatestLocation,
    createReport,
    getReportsInArea,
    createCheckIn,
    resolveCheckIn,
    createAuditLog,
    disconnect
};
