import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Audio } from 'expo-av';

interface SOSCountdownModalProps {
    visible: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    countdownSeconds?: number;
}

export const SOSCountdownModal: React.FC<SOSCountdownModalProps> = ({
    visible,
    onCancel,
    onConfirm,
    countdownSeconds = 5
}) => {
    const [timeLeft, setTimeLeft] = useState(countdownSeconds);
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    useEffect(() => {
        if (visible) {
            setTimeLeft(countdownSeconds);
            // playAlarm(); // Future: Load alarm sound
        } else {
            stopAlarm();
        }
    }, [visible]);

    useEffect(() => {
        if (!visible) return;

        if (timeLeft === 0) {
            onConfirm();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, visible]);

    const stopAlarm = async () => {
        if (sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
            setSound(null);
        }
    };

    if (!visible) return null;

    return (
        <Modal transparent animationType="fade" visible={visible}>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <Text style={styles.title}>SOS TRIGGERED</Text>
                    <Text style={styles.subtitle}>Alerting emergency contacts in</Text>

                    <View style={styles.timerContainer}>
                        <Text style={styles.timerText}>{timeLeft}</Text>
                    </View>

                    <Text style={styles.warning}>
                        This will share your live location and notify your emergency contacts.
                    </Text>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                            <Text style={styles.cancelText}>CANCEL</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                            <Text style={styles.confirmText}>SEND NOW</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    content: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        alignItems: 'center'
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#e53e3e',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 18,
        color: '#4a5568',
        marginBottom: 24
    },
    timerContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 6,
        borderColor: '#e53e3e',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32
    },
    timerText: {
        fontSize: 60,
        fontWeight: 'bold',
        color: '#e53e3e'
    },
    warning: {
        textAlign: 'center',
        color: '#718096',
        marginBottom: 32,
        fontSize: 14,
        lineHeight: 20
    },
    actions: {
        flexDirection: 'row',
        gap: 16,
        width: '100%'
    },
    cancelButton: {
        flex: 1,
        padding: 18,
        borderRadius: 12,
        backgroundColor: '#f7fafc',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#cbd5e0'
    },
    cancelText: {
        fontWeight: 'bold',
        color: '#4a5568',
        fontSize: 16
    },
    confirmButton: {
        flex: 1,
        padding: 18,
        borderRadius: 12,
        backgroundColor: '#e53e3e',
        alignItems: 'center'
    },
    confirmText: {
        fontWeight: 'bold',
        color: '#fff',
        fontSize: 16
    }
});
