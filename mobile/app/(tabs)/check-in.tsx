import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Switch, ScrollView, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Radius, Spacing, GlassCard } from '../../constants/theme';

export default function CheckInScreen() {
    const [destination, setDestination] = useState('');
    const [time, setTime] = useState(new Date());
    const [gracePeriod, setGracePeriod] = useState(15);
    const [shareJourney, setShareJourney] = useState(false);

    const handleStartCheckIn = () => {
        if (!destination) {
            Alert.alert('Missing Info', 'Please enter a destination.');
            return;
        }
        Alert.alert('Check-In Started', `Journey to ${destination} started. Expected arrival: ${time.toLocaleTimeString()}`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.bgPrimary} />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Journey Check-In</Text>
                <Ionicons name="navigate" size={22} color={Colors.accentPrimary} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.label}>Where are you going?</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="location-outline" size={18} color={Colors.textMuted} />
                        <TextInput style={styles.input} placeholder="Enter destination" value={destination} onChangeText={setDestination} placeholderTextColor={Colors.textMuted} />
                    </View>

                    <Text style={styles.label}>When should you arrive?</Text>
                    <View style={styles.timeSelectorContainer}>
                        <TouchableOpacity style={styles.timeAdjustBtn} onPress={() => setTime(new Date(time.getTime() - 15 * 60000))}>
                            <Ionicons name="remove" size={20} color={Colors.textSecondary} />
                        </TouchableOpacity>
                        <View style={styles.timeSelector}>
                            <Ionicons name="time-outline" size={18} color={Colors.accentPrimary} />
                            <Text style={styles.timeText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                        <TouchableOpacity style={styles.timeAdjustBtn} onPress={() => setTime(new Date(time.getTime() + 15 * 60000))}>
                            <Ionicons name="add" size={20} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Grace period before alert:</Text>
                    <View style={styles.graceOptions}>
                        {[15, 30, 45].map((mins) => (
                            <TouchableOpacity key={mins} style={[styles.graceOption, gracePeriod === mins && styles.graceOptionActive]} onPress={() => setGracePeriod(mins)}>
                                <Text style={[styles.graceOptionText, gracePeriod === mins && styles.graceOptionTextActive]}>{mins} min</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.toggleCard}>
                    <View>
                        <Text style={styles.toggleLabel}>Share Live Journey</Text>
                        <Text style={styles.toggleSub}>Contacts see your location during journey</Text>
                    </View>
                    <Switch
                        value={shareJourney}
                        onValueChange={setShareJourney}
                        trackColor={{ false: '#E8E0F0', true: 'rgba(214,36,110,0.3)' }}
                        thumbColor={shareJourney ? Colors.accentPrimary : Colors.textMuted}
                    />
                </View>

                <TouchableOpacity onPress={handleStartCheckIn} activeOpacity={0.8} style={{ borderRadius: Radius.md, overflow: 'hidden', marginTop: Spacing.lg, marginBottom: 40 }}>
                    <LinearGradient colors={Colors.accentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.startButtonGradient}>
                        <Ionicons name="navigate" size={20} color="#fff" />
                        <Text style={styles.startButtonText}>Start Check-In</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bgPrimary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, paddingTop: Spacing.xxl },
    headerTitle: { ...Typography.h1, color: Colors.textPrimary },
    content: { flex: 1, padding: Spacing.xl },
    card: { ...GlassCard, padding: Spacing.xxl, marginBottom: Spacing.lg },
    label: { ...Typography.bodyBold, color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.lg },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgInput, borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 50, borderWidth: 1, borderColor: Colors.borderInput, gap: Spacing.sm },
    input: { flex: 1, ...Typography.body, color: Colors.textPrimary },
    timeSelectorContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    timeAdjustBtn: { width: 48, height: 48, borderRadius: Radius.md, backgroundColor: Colors.bgInput, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.borderInput },
    timeSelector: { flex: 1, marginHorizontal: Spacing.md, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgInput, borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 50, borderWidth: 1, borderColor: Colors.borderInput, gap: Spacing.sm },
    timeText: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
    graceOptions: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
    graceOption: { flex: 1, borderWidth: 1, borderColor: Colors.borderInput, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.bgInput },
    graceOptionActive: { borderColor: Colors.accentPrimary, backgroundColor: 'rgba(214,36,110,0.1)' },
    graceOptionText: { ...Typography.bodyBold, color: Colors.textSecondary },
    graceOptionTextActive: { color: Colors.accentPrimary },
    toggleCard: { ...GlassCard, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl },
    toggleLabel: { ...Typography.bodyBold, color: Colors.textPrimary, marginBottom: 4 },
    toggleSub: { ...Typography.small, color: Colors.textMuted },
    startButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: Spacing.sm },
    startButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
