import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../../store/onboardingStore';

export default function Step4_Preferences() {
    const router = useRouter();
    const { sosPreferences, setSosPreference } = useOnboardingStore();

    const handleNext = () => {
        router.push('/onboarding/Step5_FakeCall');
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>SOS Triggers</Text>
            <Text style={styles.subtext}>How would you like to request help in an emergency?</Text>

            <View style={styles.settingRecord}>
                <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Power Button (5 times)</Text>
                    <Text style={styles.settingDesc}>Press the power button 5 times rapidly</Text>
                </View>
                <Switch
                    value={sosPreferences.powerButton}
                    onValueChange={(val) => setSosPreference('powerButton', val)}
                />
            </View>

            <View style={styles.settingRecord}>
                <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Shake Phone</Text>
                    <Text style={styles.settingDesc}>Shake phone vigorously 3 times</Text>
                </View>
                <Switch
                    value={sosPreferences.shakeGesture}
                    onValueChange={(val) => setSosPreference('shakeGesture', val)}
                />
            </View>

            <View style={styles.settingRecord}>
                <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Auto-record Audio</Text>
                    <Text style={styles.settingDesc}>Start recording audio when SOS triggers</Text>
                </View>
                <Switch
                    value={sosPreferences.autoRecordAudio}
                    onValueChange={(val) => setSosPreference('autoRecordAudio', val)}
                />
            </View>

            <View style={styles.settingRecord}>
                <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>SOS Countdown</Text>
                    <Text style={styles.settingDesc}>Delay before contacts are notified</Text>
                </View>
                <View style={styles.countdownOptions}>
                    {[3, 5, 10].map(sec => (
                        <TouchableOpacity
                            key={sec}
                            style={[styles.cdBtn, sosPreferences.countdownSeconds === sec && styles.cdBtnActive]}
                            onPress={() => setSosPreference('countdownSeconds', sec)}
                        >
                            <Text style={[styles.cdBtnText, sosPreferences.countdownSeconds === sec && styles.cdBtnTextActive]}>{sec}s</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 24, backgroundColor: '#fff', paddingTop: 60 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
    subtext: { fontSize: 14, color: '#666', marginBottom: 32 },
    settingRecord: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
    settingText: { flex: 1, paddingRight: 16 },
    settingTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    settingDesc: { fontSize: 12, color: '#666' },
    countdownOptions: { flexDirection: 'row', gap: 8 },
    cdBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#f0f0f0' },
    cdBtnActive: { backgroundColor: '#e53e3e' },
    cdBtnText: { color: '#333' },
    cdBtnTextActive: { color: '#fff', fontWeight: 'bold' },
    button: { backgroundColor: '#e53e3e', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 'auto' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
