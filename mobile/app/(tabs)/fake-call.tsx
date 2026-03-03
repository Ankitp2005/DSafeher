import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useFakeCallStore } from '../../store/fakeCallStore';
import { fakeCallService } from '../../services/fakeCallService';

export default function FakeCallSetupScreen() {
    const { fakeCallSetup, setFakeCallSetup } = useOnboardingStore();
    const { setStatus, setCallerName } = useFakeCallStore();
    const [callerName, setCallerNameLocal] = useState(fakeCallSetup.callerName);
    const [delay, setDelay] = useState(0);

    const handleSchedule = () => {
        setFakeCallSetup(callerName);
        if (delay === 0) {
            setCallerName(callerName);
            setStatus('incoming');
        } else {
            fakeCallService.scheduleFakeCall(delay, { callerName });
            alert(`Fake call scheduled in ${delay} seconds.`);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Fake Call Simulator</Text>
            <Text style={styles.subtext}>Trigger a realistic incoming phone call to excuse yourself from uncomfortable situations.</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Caller Name</Text>
                <TextInput
                    style={styles.input}
                    value={callerName}
                    onChangeText={setCallerNameLocal}
                    placeholder="e.g. Mom, Boss, Home"
                />

                <Text style={styles.label}>Trigger Call In:</Text>
                <View style={styles.delayGrid}>
                    {[{ l: 'Now', v: 0 }, { l: '30s', v: 30 }, { l: '1 min', v: 60 }, { l: '5 min', v: 300 }].map((opt) => (
                        <TouchableOpacity
                            key={opt.v}
                            style={[styles.delayBtn, delay === opt.v && styles.delayBtnActive]}
                            onPress={() => setDelay(opt.v)}
                        >
                            <Text style={[styles.delayBtnText, delay === opt.v && styles.delayBtnTextActive]}>{opt.l}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.scheduleBtn} onPress={handleSchedule}>
                    <Text style={styles.scheduleBtnText}>Schedule Fake Call</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.tipText}>💡 Tip: You can also shake your phone on the home screen to instantly trigger a 30s delayed fake call.</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 24, backgroundColor: '#f0f4f8' },
    header: { fontSize: 28, fontWeight: 'bold', marginBottom: 8, color: '#2d3748' },
    subtext: { fontSize: 16, color: '#718096', marginBottom: 24, lineHeight: 24 },
    card: { backgroundColor: '#fff', padding: 24, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#4a5568', marginTop: 16 },
    input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 16, color: '#2d3748' },
    delayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
    delayBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#edf2f7', flex: 1, minWidth: '40%', alignItems: 'center' },
    delayBtnActive: { backgroundColor: '#3182ce' },
    delayBtnText: { color: '#4a5568', fontWeight: 'bold' },
    delayBtnTextActive: { color: '#fff' },
    scheduleBtn: { backgroundColor: '#38a169', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 32 },
    scheduleBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    tipText: { marginTop: 24, fontSize: 14, color: '#718096', fontStyle: 'italic', textAlign: 'center' }
});
