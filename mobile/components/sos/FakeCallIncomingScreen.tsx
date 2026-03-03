import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

interface Props {
    callerName: string;
    onAccept: () => void;
    onDecline: () => void;
}

export const FakeCallIncomingScreen: React.FC<Props> = ({ callerName, onAccept, onDecline }) => {
    useEffect(() => {
        let soundObject: Audio.Sound | null = null;

        const playRingtone = async () => {
            try {
                // IMPORTANT: Only load actual audio files (.mp3, .wav)
                // For now, we'll just log and rely on Haptics if no file is present
                console.log('Ringtone triggered (Audio disabled until valid asset added)');
            } catch (error) {
                console.log('Could not play ringtone:', error);
            }
        };

        playRingtone();

        // Vibrate like a real phone call (long pulses)
        const interval = setInterval(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 400);
        }, 2000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.topSection}>
                <Text style={styles.incomingText}>Incoming call</Text>
                <Text style={styles.callerName}>{callerName}</Text>
                <Text style={styles.phoneNumber}>Mobile</Text>
            </View>

            <View style={styles.bottomSection}>
                <View style={styles.actionRow}>
                    <View style={styles.actionItem}>
                        <TouchableOpacity style={[styles.btn, styles.declineBtn]} onPress={onDecline}>
                            <Text style={styles.iconText}>✕</Text>
                        </TouchableOpacity>
                        <Text style={styles.actionText}>Decline</Text>
                    </View>

                    <View style={styles.actionItem}>
                        <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={onAccept}>
                            <Text style={styles.iconText}>📞</Text>
                        </TouchableOpacity>
                        <Text style={styles.actionText}>Accept</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute', top: 0, left: 0, width, height,
        backgroundColor: '#1c1c1e', // iOS Dark Mode Call Screen Color
        zIndex: 9999,
        justifyContent: 'space-between',
        paddingTop: 80,
        paddingBottom: 60
    },
    topSection: { alignItems: 'center' },
    incomingText: { color: '#8e8e93', fontSize: 18, marginBottom: 8 },
    callerName: { color: '#fff', fontSize: 36, fontWeight: '400', marginBottom: 4 },
    phoneNumber: { color: '#8e8e93', fontSize: 18 },
    bottomSection: { paddingHorizontal: 40 },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
    actionItem: { alignItems: 'center' },
    btn: { width: 75, height: 75, borderRadius: 37.5, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    declineBtn: { backgroundColor: '#ff3b30' },
    acceptBtn: { backgroundColor: '#34c759' },
    actionText: { color: '#fff', fontSize: 16 },
    iconText: { color: '#fff', fontSize: 32, fontWeight: 'bold' }
});
