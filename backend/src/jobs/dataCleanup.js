/**
 * Data Cleanup Jobs
 * Automated data lifecycle management for SafeHer
 * 
 * Since Bull requires a running Redis instance, we provide
 * standalone functions that can be called via cron or Bull.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── DAILY CLEANUP (Run at 2AM) ───

async function dailyCleanup() {
    console.log('[DataCleanup] Starting daily cleanup...');
    const results = {};

    // 1. Delete location_tracking records older than 30 days
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const deleted = await prisma.locationTracking.deleteMany({
            where: { recordedAt: { lt: thirtyDaysAgo } }
        });
        results.locationTracking = deleted.count;
        console.log(`[DataCleanup] Deleted ${deleted.count} old location records`);
    } catch (err) {
        console.error('[DataCleanup] Location cleanup failed:', err.message);
    }

    // 2. Delete expired community reports
    try {
        const deleted = await prisma.communityReport.deleteMany({
            where: { expiresAt: { lt: new Date() } }
        });
        results.expiredReports = deleted.count;
        console.log(`[DataCleanup] Deleted ${deleted.count} expired reports`);
    } catch (err) {
        console.error('[DataCleanup] Report cleanup failed:', err.message);
    }

    // 3. Delete expired & revoked refresh tokens
    try {
        const deleted = await prisma.refreshToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { revokedAt: { not: null } }
                ]
            }
        });
        results.refreshTokens = deleted.count;
        console.log(`[DataCleanup] Deleted ${deleted.count} expired/revoked tokens`);
    } catch (err) {
        console.error('[DataCleanup] Token cleanup failed:', err.message);
    }

    // 4. Delete audit logs older than 90 days
    try {
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const deleted = await prisma.auditLog.deleteMany({
            where: { createdAt: { lt: ninetyDaysAgo } }
        });
        results.auditLogs = deleted.count;
        console.log(`[DataCleanup] Deleted ${deleted.count} old audit logs`);
    } catch (err) {
        console.error('[DataCleanup] Audit log cleanup failed:', err.message);
    }

    console.log('[DataCleanup] Daily cleanup complete:', results);
    return results;
}

// ─── WEEKLY CLEANUP ───

async function weeklyCleanup() {
    console.log('[DataCleanup] Starting weekly cleanup...');
    const results = {};

    // 1. Delete inactive danger zones (no incidents in 45 days)
    try {
        const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
        const deleted = await prisma.dangerZone.deleteMany({
            where: {
                lastIncidentAt: { lt: fortyFiveDaysAgo },
                isActive: true
            }
        });
        results.staleDangerZones = deleted.count;
        console.log(`[DataCleanup] Deactivated ${deleted.count} stale danger zones`);
    } catch (err) {
        console.error('[DataCleanup] Danger zone cleanup failed:', err.message);
    }

    // 2. Compress resolved SOS alerts older than 7 days
    // (Delete location trail but keep the alert summary)
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const resolvedAlerts = await prisma.sosAlert.findMany({
            where: {
                status: { in: ['RESOLVED', 'FALSE_ALARM', 'CANCELLED'] },
                resolvedAt: { lt: sevenDaysAgo }
            },
            select: { id: true }
        });

        if (resolvedAlerts.length > 0) {
            const alertIds = resolvedAlerts.map(a => a.id);
            const deleted = await prisma.locationTracking.deleteMany({
                where: { sosAlertId: { in: alertIds } }
            });
            results.compressedLocations = deleted.count;
            console.log(`[DataCleanup] Compressed ${deleted.count} location points from ${alertIds.length} resolved alerts`);
        }
    } catch (err) {
        console.error('[DataCleanup] SOS compression failed:', err.message);
    }

    console.log('[DataCleanup] Weekly cleanup complete:', results);
    return results;
}

// ─── ON SOS RESOLVE ───

async function scheduleLocationDeletion(alertId) {
    // In production, this would be a Bull delayed job
    // For now, we log a note; the weekly cleanup handles it
    console.log(`[DataCleanup] Location data for alert ${alertId} scheduled for deletion in 7 days`);
}

// ─── CRON SETUP (uses setInterval for simplicity, swap with Bull in production) ───

function startCleanupScheduler() {
    // Daily at approximately 2AM
    const dailyMs = 24 * 60 * 60 * 1000;
    setInterval(async () => {
        const hour = new Date().getHours();
        if (hour === 2) {
            await dailyCleanup();
        }
    }, 60 * 60 * 1000); // Check every hour

    // Weekly on Sundays
    setInterval(async () => {
        const now = new Date();
        if (now.getDay() === 0 && now.getHours() === 3) {
            await weeklyCleanup();
        }
    }, 60 * 60 * 1000);

    console.log('[DataCleanup] Cleanup scheduler started');
}

module.exports = {
    dailyCleanup,
    weeklyCleanup,
    scheduleLocationDeletion,
    startCleanupScheduler
};
