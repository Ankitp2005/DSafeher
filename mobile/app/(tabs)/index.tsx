import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Accelerometer } from 'expo-sensors';
import { SOSButton } from '../../components/sos/SOSButton';
import { SOSCountdownModal } from '../../components/sos/SOSCountdownModal';
import { sosService } from '../../services/sosService';
import { fakeCallService } from '../../services/fakeCallService';
import { Colors, Typography, Radius, Spacing, GlassCard, Shadows } from '../../constants/theme';

export default function HomeScreen() {
    const router = useRouter();
    const [isCountdownVisible, setIsCountdownVisible] = useState(false);

    React.useEffect(() => {
        let subscription: any = null;

        const setupShake = async () => {
            let lastUpdate = 0;
            const SHAKE_THRESHOLD_SOS = 3.5;
            const SHAKE_THRESHOLD_FAKE = 2.0;

            const isAvailable = await Accelerometer.isAvailableAsync();
            if (!isAvailable) return;

            subscription = Accelerometer.addListener((data: { x: number; y: number; z: number }) => {
                const { x, y, z } = data;
                const acceleration = Math.sqrt(x * x + y * y + z * z);
                const now = Date.now();

                if (now - lastUpdate > 1000) {
                    if (acceleration > SHAKE_THRESHOLD_SOS) {
                        lastUpdate = now;
                        setIsCountdownVisible(true);
                    } else if (acceleration > SHAKE_THRESHOLD_FAKE) {
                        lastUpdate = now;
                        fakeCallService.scheduleFakeCall(30, { callerName: 'Mom' });
                        alert('Fake call scheduled in 30s due to shake.');
                    }
                }
            });

            Accelerometer.setUpdateInterval(100);
        };

        setupShake();
        return () => { if (subscription) subscription.remove(); };
    }, []);

    const handleSOSTrigger = () => setIsCountdownVisible(true);

    const handleSOSConfirm = async () => {
        setIsCountdownVisible(false);
        try {
            const data = await sosService.triggerSOS('button');
            router.push({ pathname: '/sos/active', params: { alertId: data.alert_id } });
        } catch (error) {
            router.push('/sos/active');
        }
    };

    const handleSOSCancel = () => setIsCountdownVisible(false);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.bgPrimary} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>{getGreeting()},</Text>
                    <Text style={styles.userName}>SafeHer User</Text>
                </View>
                <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/settings')}>
                    <LinearGradient
                        colors={Colors.accentGradient}
                        style={styles.profileGradient}
                    >
                        <Ionicons name="person" size={20} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Status Card */}
            <View style={styles.statusCard}>
                <View style={styles.statusPill}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusLabel}>PROTECTED</Text>
                </View>
                <Text style={styles.statusText}>You are currently in a safe area. All systems active.</Text>
            </View>

            {/* SOS Button */}
            <View style={styles.sosContainer}>
                <SOSButton onTrigger={handleSOSTrigger} />
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/fake-call')}>
                    <View style={[styles.actionIcon, { backgroundColor: Colors.infoBg }]}>
                        <Ionicons name="call-outline" size={22} color={Colors.info} />
                    </View>
                    <Text style={styles.actionLabel}>Fake Call</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/check-in')}>
                    <View style={[styles.actionIcon, { backgroundColor: Colors.safeBg }]}>
                        <Ionicons name="location-outline" size={22} color={Colors.safe} />
                    </View>
                    <Text style={styles.actionLabel}>Check-In</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/routes')}>
                    <View style={[styles.actionIcon, { backgroundColor: Colors.warningBg }]}>
                        <Ionicons name="map-outline" size={22} color={Colors.warning} />
                    </View>
                    <Text style={styles.actionLabel}>Safe Route</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/community')}>
                    <View style={[styles.actionIcon, { backgroundColor: 'rgba(214,36,110,0.1)' }]}>
                        <Ionicons name="people-outline" size={22} color={Colors.accentPrimary} />
                    </View>
                    <Text style={styles.actionLabel}>Community</Text>
                </TouchableOpacity>
            </View>

            {/* Emergency Contacts */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Emergency Contacts</Text>
                <View style={styles.contactsRow}>
                    <View style={styles.contactCircle}>
                        <Text style={styles.contactInitial}>M</Text>
                    </View>
                    <View style={styles.contactCircle}>
                        <Text style={styles.contactInitial}>D</Text>
                    </View>
                    <TouchableOpacity style={styles.addContactCircle}>
                        <Ionicons name="add" size={22} color={Colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </View>

            <SOSCountdownModal
                visible={isCountdownVisible}
                onCancel={handleSOSCancel}
                onConfirm={handleSOSConfirm}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgPrimary,
    },
    content: {
        padding: Spacing.xxl,
        paddingTop: 60,
        paddingBottom: 40
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xxxl,
    },
    greeting: {
        ...Typography.caption,
        color: Colors.textSecondary,
    },
    userName: {
        ...Typography.h1,
        color: Colors.textPrimary,
        marginTop: 2,
    },
    profileButton: {
        borderRadius: 22,
        overflow: 'hidden',
    },
    profileGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusCard: {
        ...GlassCard,
        padding: Spacing.xl,
        marginBottom: Spacing.xxxl,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.safeBg,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: Radius.pill,
        alignSelf: 'flex-start',
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(34,197,94,0.2)',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.safe,
        marginRight: 8,
    },
    statusLabel: {
        color: Colors.safe,
        ...Typography.small,
        fontWeight: '700',
    },
    statusText: {
        ...Typography.body,
        color: Colors.textSecondary,
    },
    sosContainer: {
        alignItems: 'center',
        marginVertical: Spacing.lg,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 40,
        marginBottom: Spacing.xxxl,
    },
    actionCard: {
        alignItems: 'center',
        width: '23%',
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.borderCard,
    },
    actionLabel: {
        ...Typography.small,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    section: {
        marginBottom: Spacing.xxl,
    },
    sectionTitle: {
        ...Typography.h3,
        color: Colors.textPrimary,
        marginBottom: Spacing.lg,
    },
    contactsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    contactCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.bgCard,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.borderCard,
    },
    contactInitial: {
        ...Typography.h3,
        color: Colors.textPrimary,
    },
    addContactCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.borderCard,
        borderStyle: 'dashed',
    },
});
