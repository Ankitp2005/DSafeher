import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, SafeAreaView, ActivityIndicator } from 'react-native';
import MapView, { Marker, Heatmap } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { getIncidentsMap } from '../../services/reportService';
import ReportIncidentModal from '../../components/community/ReportIncidentModal';
import * as Location from 'expo-location';

export default function CommunityScreen() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'map' | 'heatmap'>('map');
    const [isModalVisible, setModalVisible] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ latitude: number, longitude: number } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        // Get user location
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            let location = await Location.getCurrentPositionAsync({});
            setCurrentLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
        } else {
            setCurrentLocation({
                latitude: 19.0760, // Default to Mumbai
                longitude: 72.8777
            });
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
            default: return 'black'; // unsafe area / other
        }
    };

    const getHeatmapPoints = () => {
        return reports.map(r => ({
            latitude: r.latitude,
            longitude: r.longitude,
            weight: (r.incident_type === 'assault' || r.incident_type === 'harassment') ? 2 : 1
        }));
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Community Safety Map</Text>
                <View style={styles.viewToggle}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
                        onPress={() => setViewMode('map')}
                    >
                        <Ionicons name="location" size={16} color={viewMode === 'map' ? 'white' : '#718096'} />
                        <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>Pins</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, viewMode === 'heatmap' && styles.toggleBtnActive]}
                        onPress={() => setViewMode('heatmap')}
                    >
                        <Ionicons name="flame" size={16} color={viewMode === 'heatmap' ? 'white' : '#718096'} />
                        <Text style={[styles.toggleText, viewMode === 'heatmap' && styles.toggleTextActive]}>Heat</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading || !currentLocation ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#e53e3e" />
                </View>
            ) : (
                <MapView
                    style={styles.map}
                    initialRegion={{
                        ...currentLocation,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                    }}
                >
                    {viewMode === 'map' ? (
                        reports.map(report => (
                            <Marker
                                key={report.id}
                                coordinate={{ latitude: report.latitude, longitude: report.longitude }}
                                pinColor={getMarkerColor(report.incident_type)}
                                title={report.incident_type.replace('_', ' ').toUpperCase()}
                                description="Community report"
                            />
                        ))
                    ) : (
                        reports.length > 0 && (
                            <Heatmap
                                points={getHeatmapPoints()}
                                radius={40}
                                opacity={0.7}
                            />
                        )
                    )}
                </MapView>
            )}

            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Ionicons name="add-circle" size={24} color="white" />
                <Text style={styles.fabText}>Report Incident</Text>
            </TouchableOpacity>

            <ReportIncidentModal
                visible={isModalVisible}
                onClose={() => setModalVisible(false)}
                currentLocation={currentLocation}
                onSuccess={loadData}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    header: {
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    viewToggle: {
        flexDirection: 'row',
        backgroundColor: '#EDF2F7',
        borderRadius: 20,
        padding: 4,
    },
    toggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    toggleBtnActive: {
        backgroundColor: '#2D3748',
    },
    toggleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#718096',
        marginLeft: 4,
    },
    toggleTextActive: {
        color: 'white',
    },
    map: {
        flex: 1,
        width: Dimensions.get('window').width,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        alignSelf: 'center',
        backgroundColor: '#E53E3E',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    fabText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    }
});
