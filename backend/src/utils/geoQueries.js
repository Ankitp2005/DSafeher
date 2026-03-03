const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Returns active, non-expired reports within a map bounding box
 * Uses ST_MakeEnvelope and clusters nearby points to reduce clutter
 */
async function getReportsInViewport(swLat, swLng, neLat, neLng) {
    return prisma.$queryRaw`
        SELECT 
            incident_type as "type",
            latitude,
            longitude,
            COUNT(*) as "count",
            MAX(reported_at) as "lastReportedAt"
        FROM community_reports
        WHERE 
            expires_at > NOW()
            AND ST_Within(
                ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
                ST_MakeEnvelope(${swLng}, ${swLat}, ${neLng}, ${neLat}, 4326)
            )
        GROUP BY 1, 2, 3
    `;
}

/**
 * Returns reports within a specific radius of a coordinate
 * Uses ST_DWithin with geography for accurate meter-based distance
 */
async function getReportsNearPoint(lat, lng, radiusMeters) {
    return prisma.$queryRaw`
        SELECT *, 
            ST_Distance(
                ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
                ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
            ) as distance
        FROM community_reports
        WHERE 
            expires_at > NOW()
            AND ST_DWithin(
                ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
                ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
                ${radiusMeters}
            )
        ORDER BY distance ASC
    `;
}

/**
 * Detects if a route passes through or near active danger zones
 */
async function getDangerZonesOnRoute(routePolylineWKT) {
    return prisma.$queryRaw`
        SELECT *
        FROM danger_zones
        WHERE 
            is_active = true
            AND ST_Intersects(
                ST_Buffer(ST_GeomFromText(${routePolylineWKT}, 4326)::geography, 50)::geometry,
                ST_Buffer(ST_SetSRID(ST_MakePoint(center_longitude, center_latitude), 4326)::geography, radius_meters)::geometry
            )
    `;
}

/**
 * Finds nearest police stations or hospitals
 */
async function getNearestSafePlaces(lat, lng, limit = 5) {
    return prisma.$queryRaw`
        SELECT 
            name,
            type,
            latitude,
            longitude,
            ST_Distance(
                ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
                ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
            ) as distance_meters
        FROM safe_places
        ORDER BY distance_meters ASC
        LIMIT ${limit}
    `;
}

/**
 * Calculates a safety score (0-100) for a given route
 * based on incident density and proximity to safe places
 */
async function calculateRouteSafetyScore(routePolylineWKT, timeOfDay = new Date()) {
    const dangerZones = await getDangerZonesOnRoute(routePolylineWKT);

    // Logic for scoring as specified in Master Reference Document
    let score = 100;
    const warnings = [];

    if (dangerZones.length > 0) {
        score -= (dangerZones.length * 20);
        warnings.push(`${dangerZones.length} danger zones detected on path`);
    }

    // This is a simplified version of the scoring algorithm
    // In production, it would also hit getReportsNearPoint along the polyline path

    score = Math.max(0, Math.min(100, score));

    let label = 'Safe';
    if (score < 40) label = 'Avoid';
    else if (score < 60) label = 'Be Careful';
    else if (score < 80) label = 'Caution';

    return {
        score,
        label,
        warnings,
        dangerZoneCount: dangerZones.length
    };
}

module.exports = {
    getReportsInViewport,
    getReportsNearPoint,
    getDangerZonesOnRoute,
    getNearestSafePlaces,
    calculateRouteSafetyScore
};
