const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
);

const routeService = {
    calculateSafetyScore: async (routeOptions, timeOfDay) => {
        // In a production environment, this function takes physical polylines
        // from Google Directions API and checks against PostGIS ST_DWithin
        // For this boilerplate, we'll assign pseudo-scores and mock the query logic.

        const scoredRoutes = routeOptions.map(route => {
            let baseScore = 100;
            let warnings = [];

            // 1. Time of day multiplier
            const hour = timeOfDay.getHours();
            const isNight = hour >= 22 || hour <= 6;
            let timeMultiplier = 1.0;

            if (isNight) {
                timeMultiplier = 0.6;
                warnings.push("Safer before 8PM. Low lighting expected.");
            } else if (hour >= 20 && hour < 22) {
                timeMultiplier = 0.8;
            }

            // 2. Mock: Penalty for community reports intersecting route
            // Normally: SELECT count(*) FROM reports WHERE ST_DWithin(route_geom, report_geom, 500)
            const mockIncidentCount = Math.floor(Math.random() * 3);
            if (mockIncidentCount > 0) {
                baseScore -= (mockIncidentCount * 10);
                warnings.push(`${mockIncidentCount} reports of harassment nearby.`);
            }

            // 3. Mock: Penalty for Danger Zones
            const mockZoneCount = Math.floor(Math.random() * 2);
            if (mockZoneCount > 0) {
                baseScore -= (mockZoneCount * 20);
                warnings.push("Passes through a known danger zone. Avoid if possible.");
            }

            // 4. Mock: Bonus for safe places
            const mockSafePlacesCount = Math.floor(Math.random() * 3);
            baseScore += (mockSafePlacesCount * 10);

            // Final calculation
            let finalScore = Math.floor(baseScore * timeMultiplier);

            // Clamp between 0-100
            finalScore = Math.max(0, Math.min(100, finalScore));

            // Labeling
            let safetyLabel = 'Safe';
            if (finalScore <= 40) safetyLabel = 'Avoid';
            else if (finalScore <= 70) safetyLabel = 'Caution';

            return {
                ...route,
                safety_score: finalScore,
                safety_label: safetyLabel,
                incident_count_nearby: mockIncidentCount,
                safe_places_nearby: mockSafePlacesCount,
                warnings
            };
        });

        // Sort descending by safety score rather than duration
        return scoredRoutes.sort((a, b) => b.safety_score - a.safety_score);
    }
};

module.exports = routeService;
