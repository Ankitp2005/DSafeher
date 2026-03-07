import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, SafeAreaView, ActivityIndicator, StatusBar } from 'react-native';
import MapView, { Marker, Heatmap } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getIncidentsMap } from '../../services/reportService';
import ReportIncidentModal from '../../components/community/ReportIncidentModal';
import * as Location from 'expo-location';
import { Colors, Typography, Radius, Spacing, GlassCard } from '../../constants/theme';

export default function CommunityScreen() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'map' | 'heatmap'>('map');
    const [isModalVisible, setModalVisible] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ latitude: number, longitude: number } | null>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            let location = await Location.getCurrentPositionAsync({});
            setCurrentLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        } else {
            setCurrentLocation({ latitude: 19.0760, longitude: 72.8777 });
        }
        const data = await getIncidentsMap();
        setReports(data);
        setLoading(false);
    };

    const getMarkerColor = (type: string) => {
        switch (type) {
            case 'assault': return 'red';
            case 'harassment': return 'orange';
            case 'following': return 'orange';
            case 'poor_lighting': return 'yellow';
            case 'suspicious_activity': return 'yellow';
            default: return 'black';
        }
    };

    const getHeatmapPoints = () => reports.map(r => ({
        latitude: r.latitude, longitude: r.longitude,
        weight: (r.incident_type === 'assault' || r.incident_type === 'harassment') ? 2 : 1
    }));

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.bgPrimary} />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Community Map</Text>
                <View style={styles.viewToggle}>
                    <TouchableOpacity style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]} onPress={() => setViewMode('map')}>
                        <Ionicons name="location" size={14} color={viewMode === 'map' ? '#fff' : Colors.textMuted} />
                        <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>Pins</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.toggleBtn, viewMode === 'heatmap' && styles.toggleBtnActive]} onPress={() => setViewMode('heatmap')}>
                        <Ionicons name="flame" size={14} color={viewMode === 'heatmap' ? '#fff' : Colors.textMuted} />
                        <Text style={[styles.toggleText, viewMode === 'heatmap' && styles.toggleTextActive]}>Heat</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading || !currentLocation ? (
                <View style={styles.center}><ActivityIndicator size="large" color={Colors.accentPrimary} /></View>
            ) : (
                <MapView style={styles.map} initialRegion={{ ...currentLocation, latitudeDelta: 0.1, longitudeDelta: 0.1 }}>
                    {viewMode === 'map' ? (
                        reports.map(report => (
                            <Marker key={report.id} coordinate={{ latitude: report.latitude, longitude: report.longitude }}
                                pinColor={getMarkerColor(report.incident_type)} title={report.incident_type.replace('_', ' ').toUpperCase()} description="Community report" />
                        ))
                    ) : (
                        reports.length > 0 && <Heatmap points={getHeatmapPoints()} radius={40} opacity={0.7} />
                    )}
                </MapView>
            )}

            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
                <LinearGradient colors={Colors.accentGradient} style={styles.fabGradient}>
                    <Ionicons name="add" size={22} color="#fff" />
                    <Text style={styles.fabText}>Report</Text>
                </LinearGradient>
            </TouchableOpacity>

            <ReportIncidentModal visible={isModalVisible} onClose={() => setModalVisible(false)} currentLocation={currentLocation} onSuccess={loadData} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bgPrimary },
    header: { padding: Spacing.xl, backgroundColor: Colors.bgSecondary, borderBottomWidth: 1, borderBottomColor: Colors.borderCard, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { ...Typography.h2, color: Colors.textPrimary },
    viewToggle: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: Radius.pill, padding: 3, borderWidth: 1, borderColor: Colors.borderCard },
    toggleBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill, gap: 4 },
    toggleBtnActive: { backgroundColor: Colors.accentPrimary },
    toggleText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
    toggleTextActive: { color: '#fff' },
    map: { flex: 1, width: Dimensions.get('window').width },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    fab: { position: 'absolute', bottom: 24, alignSelf: 'center', borderRadius: Radius.pill, overflow: 'hidden' },
    fabGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, gap: 8 },
    fabText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
