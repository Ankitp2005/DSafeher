import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../../store/onboardingStore';

export default function Step3_Addresses() {
    const router = useRouter();
    const { addresses, setAddress } = useOnboardingStore();
    const [home, setHome] = useState(addresses.home);
    const [work, setWork] = useState(addresses.work);

    const handleNext = () => {
        // In a real app we would use Google Places Autocomplete here
        setAddress('home', home);
        setAddress('work', work);
        router.push('/onboarding/Step4_Preferences');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Frequent Locations</Text>
            <Text style={styles.subtext}>Used to calculate safe routes automatically.</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>🏠 Home Address *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 123 MG Road"
                    value={home}
                    onChangeText={setHome}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>💼 Work Address (Optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Tech Park, Phase 1"
                    value={work}
                    onChangeText={setWork}
                />
            </View>

            <Text style={styles.privacyNote}>🔒 Your addresses are encrypted and stored securely.</Text>

            <TouchableOpacity style={[styles.button, !home && styles.buttonDisabled]} onPress={handleNext} disabled={!home}>
                <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, backgroundColor: '#fff', paddingTop: 60 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
    subtext: { fontSize: 14, color: '#666', marginBottom: 32 },
    inputGroup: { marginBottom: 24 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
    privacyNote: { fontSize: 12, color: '#888', marginTop: 16, textAlign: 'center' },
    button: { backgroundColor: '#e53e3e', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 'auto' },
    buttonDisabled: { backgroundColor: '#fc8181' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
