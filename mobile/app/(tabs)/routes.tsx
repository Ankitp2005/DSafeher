import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getRouteSuggestions, RouteSuggestion, startJourney } from '../../services/routeService';
import SafeRouteMap from '../../components/map/SafeRouteMap';
import { Colors, Typography, Radius, Spacing, GlassCard, Shadows } from '../../constants/theme';

export default function RoutesScreen() {
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [loading, setLoading] = useState(false);
    const [routes, setRoutes] = useState<RouteSuggestion[]>([]);

    const handleSearch = async () => {
        if (!origin || !destination) return;
        setLoading(true);
        try {
            const results = await getRouteSuggestions(19.0760, 72.8777, 19.0505, 72.8252);
            setRoutes(results);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getSafetyColor = (label: string) => {
        switch (label) {
            case 'Safe': return Colors.safe;
            case 'Caution': return Colors.warning;
            case 'Avoid': return Colors.danger;
            default: return Colors.textMuted;
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

    const routeDataForMap = routes.length > 0 ? {
        id: routes[0].id,
        safety_score: routes[0].safety_score,
        points: [
            { latitude: 19.0760, longitude: 72.8777 },
            { latitude: 19.0600, longitude: 72.8500 },
            { latitude: 19.0505, longitude: 72.8252 }
        ]
    } : undefined;

    const mockDangerZones = [{ id: '1', latitude: 19.0650, longitude: 72.8600, radius: 400 }];
    const mockSafePlaces = [{ id: '1', title: 'Police Station', latitude: 19.0550, longitude: 72.8300 }];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.bgPrimary} />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Safe Routes</Text>
                <Ionicons name="shield-checkmark" size={22} color={Colors.accentPrimary} />
            </View>

            <View style={styles.searchCard}>
                <View style={styles.inputContainer}>
                    <Ionicons name="radio-button-on" size={14} color={Colors.safe} style={styles.inputIcon} />
                    <TextInput style={styles.input} placeholder="Current Location" value={origin} onChangeText={setOrigin} placeholderTextColor={Colors.textMuted} />
                </View>
                <View style={styles.connectorLine} />
                <View style={styles.inputContainer}>
                    <Ionicons name="location" size={14} color={Colors.accentPrimary} style={styles.inputIcon} />
                    <TextInput style={styles.input} placeholder="Where to?" value={destination} onChangeText={setDestination} placeholderTextColor={Colors.textMuted} />
                </View>
                <TouchableOpacity onPress={handleSearch} disabled={loading || !origin || !destination} activeOpacity={0.8} style={{ borderRadius: Radius.md, overflow: 'hidden', marginTop: Spacing.lg }}>
                    <LinearGradient colors={Colors.accentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.searchButtonGradient}>
                        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.searchButtonText}>Find Safest Route</Text>}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.resultsContainer}>
                {routes.length > 0 && (
                    <SafeRouteMap origin={{ latitude: 19.0760, longitude: 72.8777 }} destination={{ latitude: 19.0505, longitude: 72.8252 }} route={routeDataForMap} dangerZones={mockDangerZones} safePlaces={mockSafePlaces} />
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
                            <Text style={styles.detailText}><Ionicons name="time-outline" size={13} color={Colors.textSecondary} /> {route.duration}</Text>
                            <Text style={styles.detailText}><Ionicons name="swap-horizontal-outline" size={13} color={Colors.textSecondary} /> {route.distance}</Text>
                            <Text style={styles.detailText}><Ionicons name="shield-checkmark-outline" size={13} color={Colors.textSecondary} /> {route.safety_score}</Text>
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
    container: { flex: 1, backgroundColor: Colors.bgPrimary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, paddingTop: Spacing.xxl },
    headerTitle: { ...Typography.h1, color: Colors.textPrimary },
    searchCard: { ...GlassCard, margin: Spacing.lg, padding: Spacing.xl },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgInput, borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 50, borderWidth: 1, borderColor: Colors.borderInput },
    inputIcon: { marginRight: Spacing.sm },
    input: { flex: 1, ...Typography.body, color: Colors.textPrimary },
    connectorLine: { width: 1, height: 16, backgroundColor: Colors.borderCard, marginLeft: 19 },
    searchButtonGradient: { paddingVertical: 14, alignItems: 'center', borderRadius: Radius.md },
    searchButtonText: { color: '#fff', ...Typography.bodyBold, fontSize: 16 },
    resultsContainer: { flex: 1, paddingHorizontal: Spacing.lg },
    routeCard: { ...GlassCard, padding: Spacing.lg, marginBottom: Spacing.lg, borderLeftWidth: 4 },
    routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    routeTitle: { ...Typography.h3, color: Colors.textPrimary },
    badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.pill },
    badgeText: { color: '#fff', fontWeight: '700', fontSize: 11 },
    routeDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
    detailText: { ...Typography.caption, color: Colors.textSecondary },
    warningsContainer: { backgroundColor: Colors.dangerBg, padding: Spacing.md, borderRadius: Radius.sm, marginBottom: Spacing.md },
    warningText: { color: Colors.danger, fontSize: 12, marginBottom: 2 },
    startButton: { backgroundColor: Colors.bgCardHover, borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderCard },
    startButtonText: { color: Colors.textPrimary, ...Typography.bodyBold },
});
