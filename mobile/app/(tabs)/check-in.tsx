import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CheckInScreen() {
    const [destination, setDestination] = useState('');
    const [time, setTime] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [gracePeriod, setGracePeriod] = useState(15);
    const [shareJourney, setShareJourney] = useState(false);

    const handleStartCheckIn = () => {
        if (!destination) {
            Alert.alert('Missing Info', 'Please enter a destination.');
            return;
        }
        Alert.alert('Check-In Started', `Journey to ${destination} started. Expected arrival: ${time.toLocaleTimeString()}`);
    };

    const handleTimeChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || time;
        setShowPicker(false);
        setTime(currentDate);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Journey Check-In</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.label}>Where are you going?</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="location-outline" size={20} color="#666" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter destination"
                            value={destination}
                            onChangeText={setDestination}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>When should you arrive?</Text>
                    <View style={styles.timeSelectorContainer}>
                        <TouchableOpacity
                            style={styles.timeAdjustBtn}
                            onPress={() => setTime(new Date(time.getTime() - 15 * 60000))}
                        >
                            <Ionicons name="remove" size={20} color="#666" />
                        </TouchableOpacity>
                        <View style={styles.timeSelector}>
                            <Ionicons name="time-outline" size={20} color="#666" style={styles.icon} />
                            <Text style={styles.timeText}>
                                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.timeAdjustBtn}
                            onPress={() => setTime(new Date(time.getTime() + 15 * 60000))}
                        >
                            <Ionicons name="add" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Grace period before alert:</Text>
                    <View style={styles.graceOptions}>
                        {[15, 30, 45].map((mins) => (
                            <TouchableOpacity
                                key={mins}
                                style={[styles.graceOption, gracePeriod === mins && styles.graceOptionActive]}
                                onPress={() => setGracePeriod(mins)}
                            >
                                <Text style={[styles.graceOptionText, gracePeriod === mins && styles.graceOptionTextActive]}>
                                    {mins} min
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.toggleRow}>
                        <View>
                            <Text style={styles.toggleLabel}>Share Live Journey</Text>
                            <Text style={styles.toggleSub}>Contacts can see your location during journey</Text>
                        </View>
                        <Switch
                            value={shareJourney}
                            onValueChange={setShareJourney}
                            trackColor={{ false: '#d1d5db', true: '#fca5a5' }}
                            thumbColor={shareJourney ? '#ef4444' : '#f3f4f6'}
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.startButton} onPress={handleStartCheckIn}>
                    <Text style={styles.startButtonText}>Start Check-In</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
        backgroundColor: '#f9fafb',
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
    timeSelectorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timeAdjustBtn: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeSelector: {
        flex: 1,
        marginHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
        backgroundColor: '#f9fafb',
    },
    timeText: {
        fontSize: 16,
        color: '#111827',
    },
    graceOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    graceOption: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        marginHorizontal: 4,
        backgroundColor: '#f9fafb',
    },
    graceOptionActive: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
    },
    graceOptionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#4b5563',
    },
    graceOptionTextActive: {
        color: '#ef4444',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f3f4f6',
    },
    toggleLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    toggleSub: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    startButton: {
        backgroundColor: '#ef4444',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 40,
        shadowColor: '#ef4444',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
