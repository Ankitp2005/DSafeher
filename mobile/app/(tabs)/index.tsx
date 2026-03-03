import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Accelerometer } from 'expo-sensors';
import { SOSButton } from '../../components/sos/SOSButton';
import { SOSCountdownModal } from '../../components/sos/SOSCountdownModal';
import { sosService } from '../../services/sosService';
import { fakeCallService } from '../../services/fakeCallService';

export default function HomeScreen() {
    const router = useRouter();
    const [isCountdownVisible, setIsCountdownVisible] = useState(false);

    React.useEffect(() => {
        let subscription: any = null;

        const setupShake = async () => {
            let lastUpdate = 0;
            const SHAKE_THRESHOLD_SOS = 3.5; // Very hard shake
            const SHAKE_THRESHOLD_FAKE = 2.0; // Moderate shake

            const isAvailable = await Accelerometer.isAvailableAsync();
            if (!isAvailable) {
                console.log('Accelerometer not available on this device');
                return;
            }

            subscription = Accelerometer.addListener((data: { x: number; y: number; z: number }) => {
                const { x, y, z } = data;
                const acceleration = Math.sqrt(x * x + y * y + z * z);
                const now = Date.now();

                if (now - lastUpdate > 1000) { // 1s debounce
                    if (acceleration > SHAKE_THRESHOLD_SOS) {
                        lastUpdate = now;
                        console.log('SOS Shake Detected');
                        setIsCountdownVisible(true);
                    } else if (acceleration > SHAKE_THRESHOLD_FAKE) {
                        lastUpdate = now;
                        console.log('Fake Call Shake Detected');
                        fakeCallService.scheduleFakeCall(30, { callerName: 'Mom' });
                        alert('Fake call scheduled in 30s due to shake.');
                    }
                }
            });

            Accelerometer.setUpdateInterval(100);
        };

        setupShake();

        return () => {
            if (subscription) subscription.remove();
        };
    }, []);

    const handleSOSTrigger = async () => {
        setIsCountdownVisible(true);
    };

    const handleSOSConfirm = async () => {
        setIsCountdownVisible(false);
        try {
            const data = await sosService.triggerSOS('button');
            router.push({ pathname: '/sos/active', params: { alertId: data.alert_id } });
        } catch (error) {
            console.error("SOS Trigger Failed", error);
            // Even if API fails, show active screen for local tracking/UI
            router.push('/sos/active');
        }
    };

    const handleSOSCancel = () => {
        setIsCountdownVisible(false);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Good Evening,</Text>
                    <Text style={styles.userName}>SafeHer User</Text>
                </View>
                <TouchableOpacity style={styles.profileButton}>
                    <Ionicons name="person-circle-outline" size={40} color="#4a5568" />
                </TouchableOpacity>
            </View>

            <View style={styles.statusCard}>
                <View style={styles.statusPill}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusLabel}>Protected</Text>
                </View>
                <Text style={styles.statusText}>You are currently in a safe area.</Text>
            </View>

            <View style={styles.sosContainer}>
                <SOSButton onTrigger={handleSOSTrigger} />
            </View>

            <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/fake-call')}>
                    <View style={[styles.actionIcon, { backgroundColor: '#ebf8ff' }]}>
                        <Ionicons name="call-outline" size={24} color="#3182ce" />
                    </View>
                    <Text style={styles.actionLabel}>Fake Call</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard}>
                    <View style={[styles.actionIcon, { backgroundColor: '#f0fff4' }]}>
                        <Ionicons name="location-outline" size={24} color="#38a169" />
                    </View>
                    <Text style={styles.actionLabel}>Check-In</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard}>
                    <View style={[styles.actionIcon, { backgroundColor: '#fff5f5' }]}>
                        <Ionicons name="map-outline" size={24} color="#e53e3e" />
                    </View>
                    <Text style={styles.actionLabel}>Safe Route</Text>
                </TouchableOpacity>
            </View>

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
                        <Ionicons name="add" size={24} color="#718096" />
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
        backgroundColor: '#f7fafc',
    },
    content: {
        padding: 24,
        paddingTop: 60,
        paddingBottom: 40
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32
    },
    greeting: {
        fontSize: 16,
        color: '#718096'
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2d3748'
    },
    profileButton: {
        padding: 4
    },
    statusCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#edf2f7',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fff4',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 12
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#38a169',
        marginRight: 8
    },
    statusLabel: {
        color: '#2f855a',
        fontSize: 12,
        fontWeight: 'bold'
    },
    statusText: {
        color: '#4a5568',
        fontSize: 15
    },
    sosContainer: {
        alignItems: 'center',
        marginVertical: 16
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 40,
        marginBottom: 32
    },
    actionCard: {
        alignItems: 'center',
        width: '30%'
    },
    actionIcon: {
        width: 60,
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4a5568'
    },
    section: {
        marginBottom: 24
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2d3748',
        marginBottom: 16
    },
    contactsRow: {
        flexDirection: 'row',
        gap: 12
    },
    contactCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#edf2f7',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#cbd5e0'
    },
    contactInitial: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4a5568'
    },
    addContactCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#cbd5e0',
        borderStyle: 'dashed'
    }
});
