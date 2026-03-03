import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';
import { useOnboardingStore } from '../../../store/onboardingStore';
import { Ionicons } from '@expo/vector-icons';

export default function Step1_Permissions() {
    const router = useRouter();
    const { permissions, setPermission } = useOnboardingStore();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        checkCurrentPermissions();
    }, []);

    const checkCurrentPermissions = async () => {
        const { status: locStatus } = await Location.getForegroundPermissionsAsync();
        const { status: bgLocStatus } = await Location.getBackgroundPermissionsAsync();
        const { status: contactStatus } = await Contacts.getPermissionsAsync();

        setPermission('location', locStatus === 'granted' && bgLocStatus === 'granted');
        setPermission('contacts', contactStatus === 'granted');
        setChecking(false);
    };

    const requestPermissions = async () => {
        try {
            // 1. Location
            let { status: locStatus } = await Location.requestForegroundPermissionsAsync();

            if (locStatus === 'granted') {
                const { status: bgLocStatus } = await Location.requestBackgroundPermissionsAsync();
                setPermission('location', bgLocStatus === 'granted');
            } else {
                setPermission('location', false);
            }

            // 2. Contacts
            const { status: contactStatus } = await Contacts.requestPermissionsAsync();
            setPermission('contacts', contactStatus === 'granted');

        } catch (err) {
            console.error('Permission request error:', err);
            Alert.alert("Permission Error", "An error occurred while requesting permissions.");
        }
    };

    const handleNext = () => {
        router.push('/onboarding/Step2_Contacts');
    };

    if (checking) return null;

    const allEssentialGranted = permissions.location && permissions.contacts;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>SafeHer keeps you safe. Always.</Text>
            <Text style={styles.subtext}>We need a few permissions to ensure your safety tools work when you need them most.</Text>

            <View style={styles.permissionItem}>
                <View style={styles.permissionHeader}>
                    <Text style={styles.pTitle}>📍 Location Tracking</Text>
                    {permissions.location && <Ionicons name="checkmark-circle" size={20} color="#48bb78" />}
                </View>
                <Text style={styles.pDesc}>To share your position with contacts during an SOS Alert.</Text>
            </View>

            <View style={styles.permissionItem}>
                <View style={styles.permissionHeader}>
                    <Text style={styles.pTitle}>👥 Contacts Access</Text>
                    {permissions.contacts && <Ionicons name="checkmark-circle" size={20} color="#48bb78" />}
                </View>
                <Text style={styles.pDesc}>To let you choose who to alert in case of an emergency.</Text>
            </View>

            <View style={styles.permissionItem}>
                <View style={styles.permissionHeader}>
                    <Text style={styles.pTitle}>🎤 Microphone & Camera</Text>
                    {permissions.microphone && <Ionicons name="checkmark-circle" size={20} color="#48bb78" />}
                </View>
                <Text style={styles.pDesc}>For the fake call feature and collecting audio/video evidence.</Text>
            </View>

            {!allEssentialGranted ? (
                <TouchableOpacity style={styles.button} onPress={requestPermissions}>
                    <Text style={styles.buttonText}>Grant Permissions</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={[styles.button, styles.nextButton]} onPress={handleNext}>
                    <Text style={styles.buttonText}>Continue to Contacts</Text>
                </TouchableOpacity>
            )}

            {!allEssentialGranted && (
                <TouchableOpacity style={styles.skipButton} onPress={handleNext}>
                    <Text style={styles.skipText}>I'll do this later</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
    header: { fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
    subtext: { fontSize: 16, color: '#666', marginBottom: 32 },
    permissionItem: { marginBottom: 24, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 12 },
    permissionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    pTitle: { fontSize: 18, fontWeight: 'bold' },
    pDesc: { fontSize: 14, color: '#444' },
    button: { backgroundColor: '#e53e3e', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
    nextButton: { backgroundColor: '#48bb78' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    skipButton: { alignItems: 'center', marginTop: 24 },
    skipText: { color: '#718096', fontSize: 16, textDecorationLine: 'underline' }
});
