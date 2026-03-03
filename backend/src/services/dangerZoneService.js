const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
);

const dangerZoneService = {
    /**
     * Clusters recent incidents to identify danger hotspots.
     * In a production environment, this would run as a scheduled Bull job.
     */
    recalculateZones: async () => {
        try {
            console.log('Starting danger zone recalculation...');

            // 1. Fetch all reports from last 7 days that aren't already grouped
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: reports, error: reportsError } = await supabase
                .from('community_reports')
                .select('*')
                .gt('created_at', sevenDaysAgo.toISOString());

            if (reportsError) throw reportsError;
            if (!reports || reports.length < 3) {
                console.log('Insufficient reports for clustering.');
                return { clustersFound: 0 };
            }

            // 2. Simple Clustering Logic (simplified DBSCAN-like)
            // Group reports where distance < 300m
            const clusters = [];
            const visited = new Set();

            for (let i = 0; i < reports.length; i++) {
                if (visited.has(reports[i].id)) continue;

                const currentCluster = [reports[i]];
                visited.add(reports[i].id);

                for (let j = 0; j < reports.length; j++) {
                    if (i === j || visited.has(reports[j].id)) continue;

                    const dist = getDistance(
                        reports[i].latitude, reports[i].longitude,
                        reports[j].latitude, reports[j].longitude
                    );

                    if (dist <= 300) { // 300 meters
                        currentCluster.push(reports[j]);
                        visited.add(reports[j].id);
                    }
                }

                if (currentCluster.length >= 3) {
                    clusters.push(currentCluster);
                }
            }

            // 3. Update Danger Zones Table
            for (const cluster of clusters) {
                const avgLat = cluster.reduce((sum, r) => sum + r.latitude, 0) / cluster.length;
                const avgLng = cluster.reduce((sum, r) => sum + r.longitude, 0) / cluster.length;

                await supabase
                    .from('danger_zones')
                    .upsert({
                        center_lat: avgLat,
                        center_lng: avgLng,
                        radius_meters: 300,
                        incident_count: cluster.length,
                        danger_level: cluster.length >= 7 ? 'high' : 'medium',
                        updated_at: new Date().toISOString()
                    });
            }

            console.log(`Clustering complete. Found ${clusters.length} active danger zones.`);
            return { clustersFound: clusters.length };
        } catch (error) {
            console.error('Error recalculating danger zones:', error);
            return { error: error.message };
        }
    }
};

/**
 * Helper to calculate haversine distance in meters
 */
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

module.exports = dangerZoneService;
