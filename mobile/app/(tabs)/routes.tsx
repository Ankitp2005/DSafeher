import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRouteSuggestions, RouteSuggestion, startJourney } from '../../services/routeService';
import SafeRouteMap from '../../components/map/SafeRouteMap';

export default function RoutesScreen() {
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [loading, setLoading] = useState(false);
    const [routes, setRoutes] = useState<RouteSuggestion[]>([]);

    const handleSearch = async () => {
        if (!origin || !destination) return;
        setLoading(true);
        try {
            // Mocking lat/lng for demonstration based on the user's input
            const mockOriginLat = 19.0760;
            const mockOriginLng = 72.8777;
            const mockDestLat = 19.0505;
            const mockDestLng = 72.8252;

            const results = await getRouteSuggestions(mockOriginLat, mockOriginLng, mockDestLat, mockDestLng);
            setRoutes(results);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getSafetyColor = (label: string) => {
        switch (label) {
            case 'Safe': return '#48BB78';
            case 'Caution': return '#ECC94B';
            case 'Avoid': return '#F56565';
            default: return '#A0AEC0';
        }
    };

    const handleStartJourney = async (route: RouteSuggestion) => {
        try {
            await startJourney(route.summary, new Date(Date.now() + parseInt(route.duration) * 60000).toISOString());
            Alert.alert("Journey Started", `Monitoring your journey along ${route.summary}.`);
        } catch (error) {
            Alert.alert("Error", "Could not start journey tracking.");
        }
    };

    // Mocks for rendering Map polyline correctly
    const routeDataForMap = routes.length > 0 ? {
        id: routes[0].id,
        safety_score: routes[0].safety_score,
        points: [
            { latitude: 19.0760, longitude: 72.8777 },
            { latitude: 19.0600, longitude: 72.8500 },
            { latitude: 19.0505, longitude: 72.8252 }
        ]
    } : undefined;

    const mockDangerZones = [
        { id: '1', latitude: 19.0650, longitude: 72.8600, radius: 400 }
    ];

    const mockSafePlaces = [
        { id: '1', title: 'Police Station', latitude: 19.0550, longitude: 72.8300 }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Safe Route Planner</Text>
            </View>

            <View style={styles.searchCard}>
                <View style={styles.inputContainer}>
                    <Ionicons name="location-outline" size={20} color="#718096" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Current Location / Origin"
                        value={origin}
                        onChangeText={setOrigin}
                        placeholderTextColor="#A0AEC0"
                    />
                </View>
                <View style={styles.inputContainer}>
                    <Ionicons name="pin-outline" size={20} color="#e53e3e" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Where to?"
                        value={destination}
                        onChangeText={setDestination}
                        placeholderTextColor="#A0AEC0"
                    />
                </View>
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loading || !origin || !destination}>
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.searchButtonText}>Find Safest Route</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.resultsContainer}>
                {routes.length > 0 && (
                    <SafeRouteMap
                        origin={{ latitude: 19.0760, longitude: 72.8777 }}
                        destination={{ latitude: 19.0505, longitude: 72.8252 }}
                        route={routeDataForMap}
                        dangerZones={mockDangerZones}
                        safePlaces={mockSafePlaces}
                    />
                )}
                {routes.map((route, index) => (
                    <View key={index} style={[styles.routeCard, { borderLeftColor: getSafetyColor(route.safety_label) }]}>
                        <View style={styles.routeHeader}>
                            <Text style={styles.routeTitle}>{route.summary}</Text>
                            <View style={[styles.badge, { backgroundColor: getSafetyColor(route.safety_label) }]}>
                                <Text style={styles.badgeText}>{route.safety_label}</Text>
                            </View>
                        </View>
                        <View style={styles.routeDetails}>
                            <Text style={styles.detailText}><Ionicons name="time-outline" /> {route.duration}</Text>
                            <Text style={styles.detailText}><Ionicons name="swap-horizontal-outline" /> {route.distance}</Text>
                            <Text style={styles.detailText}><Ionicons name="shield-checkmark-outline" /> Score: {route.safety_score}</Text>
                        </View>
                        {route.warnings.length > 0 && (
                            <View style={styles.warningsContainer}>
                                {route.warnings.map((warning, wIdx) => (
                                    <Text key={wIdx} style={styles.warningText}>⚠️ {warning}</Text>
                                ))}
                            </View>
                        )}
                        <TouchableOpacity style={styles.startButton} onPress={() => handleStartJourney(route)}>
                            <Text style={styles.startButtonText}>Start Journey</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
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
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    searchCard: {
        backgroundColor: 'white',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDF2F7',
        borderRadius: 8,
        marginBottom: 12,
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#2D3748',
    },
    searchButton: {
        backgroundColor: '#e53e3e',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
        marginTop: 4,
    },
    searchButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    resultsContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    routeCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    routeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    routeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    routeDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    detailText: {
        color: '#4A5568',
        fontSize: 14,
    },
    warningsContainer: {
        backgroundColor: '#FFF5F5',
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
    },
    warningText: {
        color: '#C53030',
        fontSize: 13,
        marginBottom: 4,
    },
    startButton: {
        backgroundColor: '#2D3748',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    startButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    }
});
