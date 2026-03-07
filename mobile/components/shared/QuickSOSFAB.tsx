import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { sosService } from '../../services/sosService';
import { SOSCountdownModal } from '../sos/SOSCountdownModal';
import { Colors, Shadows } from '../../constants/theme';

export const QuickSOSFAB = () => {
    const router = useRouter();
    const [isCounting, setIsCounting] = React.useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.4, duration: 1200, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    const handleLongPress = () => setIsCounting(true);

    const handleConfirm = () => {
        setIsCounting(false);
        sosService.triggerSOS('button');
        router.push('/');
    };

    const handleCancel = () => setIsCounting(false);

    const pulseOpacity = pulseAnim.interpolate({
        inputRange: [1, 1.4],
        outputRange: [0.35, 0],
    });

    return (
        <View style={styles.fabContainer}>
            {/* Pulse ring */}
            <Animated.View style={[styles.pulseRing, {
                transform: [{ scale: pulseAnim }],
                opacity: pulseOpacity,
            }]} />

            <TouchableOpacity
                style={styles.fabBtn}
                onLongPress={handleLongPress}
                delayLongPress={500}
                activeOpacity={0.8}
            >
                <Ionicons name="shield" size={24} color="#fff" />
            </TouchableOpacity>

            <SOSCountdownModal
                visible={isCounting}
                onCancel={handleCancel}
                onConfirm={handleConfirm}
                countdownSeconds={3}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    fabContainer: {
        position: 'absolute',
        bottom: 86,
        right: 20,
        zIndex: 9999,
        elevation: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulseRing: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.sosPrimary,
    },
    fabBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.sosPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.glow(Colors.sosPrimary),
        borderWidth: 2,
        borderColor: 'rgba(255,45,85,0.3)',
    },
});
