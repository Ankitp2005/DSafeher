import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../../store/onboardingStore';

export default function Step5_FakeCall() {
    const router = useRouter();
    const { fakeCallSetup, setFakeCallSetup, contacts, sosPreferences } = useOnboardingStore();
    const [callerName, setCallerName] = useState(fakeCallSetup.callerName);

    const handleFinish = async () => {
        setFakeCallSetup(callerName);

        // In a real app we would send the full state payload to backend here to update the user profile
        const payload = {
            contacts,
            sosPreferences,
            fakeCallSetup: { callerName }
        };
        console.log("Saving onboarding data to backend...", payload);

        router.replace('/(tabs)');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Fake Call Setup</Text>
            <Text style={styles.subtext}>Use this to excuse yourself from uncomfortable situations with a simulated incoming call.</Text>

            <View style={styles.demoCard}>
                <View style={styles.avatarPlaceholder} />
                <TextInput
                    style={styles.callerInput}
                    value={callerName}
                    onChangeText={setCallerName}
                    placeholder="Caller Name (e.g. Mom)"
                />
                <Text style={styles.demoText}>Incoming call...</Text>
            </View>

            <Text style={styles.summaryText}>You're all set up! Stay safe.</Text>

            <TouchableOpacity style={styles.button} onPress={handleFinish}>
                <Text style={styles.buttonText}>Complete Setup</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, backgroundColor: '#fff', paddingTop: 60 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
    subtext: { fontSize: 14, color: '#666', marginBottom: 32 },
    demoCard: { backgroundColor: '#1a202c', borderRadius: 16, padding: 32, alignItems: 'center', marginBottom: 32 },
    avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#4a5568', marginBottom: 16 },
    callerInput: { color: '#fff', fontSize: 24, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#4a5568', minWidth: 150, textAlign: 'center', paddingBottom: 4, marginBottom: 8 },
    demoText: { color: '#a0aec0', fontSize: 16 },
    summaryText: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', color: '#38a169', marginBottom: 16 },
    button: { backgroundColor: '#38a169', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 'auto' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
