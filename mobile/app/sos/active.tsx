import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { sosService } from '../../services/sosService';

export default function ActiveSOSScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [duration, setDuration] = useState(0);
    const [alertData, setAlertData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const alertId = params.alertId as string;

    useEffect(() => {
        const timer = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);

        fetchAlertDetails();

        return () => clearInterval(timer);
    }, [alertId]);

    const fetchAlertDetails = async () => {
        if (!alertId) {
            setLoading(false);
            return;
        }
        try {
            const data = await sosService.getActiveAlert(alertId);
            setAlertData(data);
        } catch (err) {
            console.error('Failed to fetch alert details:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleResolve = () => {
        Alert.alert(
            "Confirm Safety",
            "Are you sure you want to resolve this SOS? This will notify your contacts that you are safe.",
            [
                { text: "No, Stay Active", style: "cancel" },
                {
                    text: "Yes, I'm Safe",
                    onPress: async () => {
                        try {
                            if (alertId) {
                                await sosService.resolveSOS(alertId);
                            }
                            router.replace('/(tabs)');
                        } catch (err) {
                            Alert.alert("Error", "Failed to resolve SOS. Please try again.");
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const callEmergency = (number: string) => {
        Linking.openURL(`tel:${number}`);
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#e53e3e" />
            </View>
        );
    }

    const contactsNotified = alertData?.contacts_notified
        ? (typeof alertData.contacts_notified === 'string' ? JSON.parse(alertData.contacts_notified) : alertData.contacts_notified)
        : [];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>🚨 SOS ACTIVE</Text>
                </View>
                <Text style={styles.timer}>{formatDuration(duration)}</Text>
                <Text style={styles.trackingHint}>Live location is being shared</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Emergency Contacts Notified</Text>
                    {contactsNotified.length > 0 ? (
                        contactsNotified.map((contact: any, index: number) => (
                            <View key={index} style={styles.contactItem}>
                                <Ionicons
                                    name={contact.status.includes('failed') ? "warning" : "checkmark-circle"}
                                    size={24}
                                    color={contact.status.includes('failed') ? "#e53e3e" : "#48bb78"}
                                />
                                <Text style={styles.contactName}>Contact #{index + 1}</Text>
                                <Text style={[
                                    styles.contactStatus,
                                    contact.status.includes('failed') && { color: '#e53e3e' }
                                ]}>
                                    {contact.status.replace('_', ' ').toUpperCase()}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noContactsText}>No contacts notified yet.</Text>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Help</Text>
                    <View style={styles.emergencyGrid}>
                        <TouchableOpacity
                            style={styles.emergencyCard}
                            onPress={() => callEmergency('112')}
                        >
                            <Ionicons name="call" size={32} color="#e53e3e" />
                            <Text style={styles.emergencyLabel}>112 (National)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.emergencyCard}
                            onPress={() => callEmergency('100')}
                        >
                            <Ionicons name="shield" size={32} color="#3182ce" />
                            <Text style={styles.emergencyLabel}>100 (Police)</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color="#718096" />
                    <Text style={styles.infoText}>
                        Keep your phone on and the app open if possible. Try to move to a well-lit, public area.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.resolveButton} onPress={handleResolve}>
                    <Text style={styles.resolveButtonText}>I AM SAFE</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#e53e3e',
        paddingTop: 60,
        paddingBottom: 32,
        alignItems: 'center',
    },
    statusBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16
    },
    statusText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    timer: {
        fontSize: 64,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 2
    },
    trackingHint: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        marginTop: 8
    },
    content: {
        flex: 1,
        padding: 24
    },
    section: {
        marginBottom: 32
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2d3748',
        marginBottom: 16
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f7fafc',
        borderRadius: 12,
        marginBottom: 8
    },
    contactName: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '600'
    },
    contactStatus: {
        fontSize: 14,
        color: '#48bb78',
        fontWeight: 'bold'
    },
    emergencyGrid: {
        flexDirection: 'row',
        gap: 16
    },
    emergencyCard: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#edf2f7',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    emergencyLabel: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4a5568',
        textAlign: 'center'
    },
    infoBox: {
        padding: 16,
        backgroundColor: '#ebf8ff',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#2b6cb0',
        lineHeight: 20
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#edf2f7'
    },
    resolveButton: {
        backgroundColor: '#48bb78',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center'
    },
    resolveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1
    },
    noContactsText: {
        color: '#718096',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 8
    }
});
