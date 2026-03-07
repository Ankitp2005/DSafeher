import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useFakeCallStore } from '../../store/fakeCallStore';
import { fakeCallService } from '../../services/fakeCallService';
import { Colors, Typography, Radius, Spacing, GlassCard } from '../../constants/theme';

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
            <StatusBar barStyle="dark-content" backgroundColor={Colors.bgPrimary} />
            <View style={styles.headerSection}>
                <Ionicons name="call" size={28} color={Colors.accentPrimary} />
                <Text style={styles.header}>Fake Call</Text>
            </View>
            <Text style={styles.subtext}>Trigger a realistic incoming phone call to excuse yourself from uncomfortable situations.</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Caller Name</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={18} color={Colors.textMuted} />
                    <TextInput
                        style={styles.input}
                        value={callerName}
                        onChangeText={setCallerNameLocal}
                        placeholder="e.g. Mom, Boss, Home"
                        placeholderTextColor={Colors.textMuted}
                    />
                </View>

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

                <TouchableOpacity onPress={handleSchedule} activeOpacity={0.8} style={{ borderRadius: Radius.md, overflow: 'hidden', marginTop: Spacing.xxl }}>
                    <LinearGradient colors={Colors.accentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.scheduleGradient}>
                        <Ionicons name="call" size={20} color="#fff" />
                        <Text style={styles.scheduleBtnText}>Schedule Fake Call</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <View style={styles.tipCard}>
                <Ionicons name="bulb-outline" size={18} color={Colors.warning} />
                <Text style={styles.tipText}>Shake your phone on the home screen to instantly trigger a 30s delayed fake call.</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: Spacing.xxl, backgroundColor: Colors.bgPrimary, paddingTop: 60 },
    headerSection: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
    header: { ...Typography.h1, color: Colors.textPrimary },
    subtext: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xxl, lineHeight: 22 },
    card: { ...GlassCard, padding: Spacing.xxl },
    label: { ...Typography.bodyBold, color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.lg },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgInput, borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 50, borderWidth: 1, borderColor: Colors.borderInput, gap: Spacing.sm },
    input: { flex: 1, ...Typography.body, color: Colors.textPrimary },
    delayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginTop: Spacing.sm },
    delayBtn: { paddingVertical: 12, paddingHorizontal: Spacing.lg, borderRadius: Radius.md, backgroundColor: Colors.bgInput, flex: 1, minWidth: '40%', alignItems: 'center', borderWidth: 1, borderColor: Colors.borderInput },
    delayBtnActive: { backgroundColor: 'rgba(214,36,110,0.1)', borderColor: Colors.accentPrimary },
    delayBtnText: { color: Colors.textSecondary, fontWeight: '600' },
    delayBtnTextActive: { color: Colors.accentPrimary },
    scheduleGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: Spacing.sm },
    scheduleBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    tipCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.xxl, backgroundColor: Colors.warningBg, padding: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)' },
    tipText: { flex: 1, ...Typography.caption, color: Colors.warning, lineHeight: 18 },
});
