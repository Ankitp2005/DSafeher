import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableWithoutFeedback, Vibration } from 'react-native';
import { Colors, Typography, Shadows } from '../../constants/theme';

interface SOSButtonProps {
    onTrigger: () => void;
    holdDuration?: number;
}

export const SOSButton: React.FC<SOSButtonProps> = ({ onTrigger, holdDuration = 3000 }) => {
    const [isHolding, setIsHolding] = useState(false);
    const progress = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Pulsating ring animation
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.25,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    const startHold = () => {
        setIsHolding(true);
        Vibration.vibrate([0, 50], true);

        Animated.parallel([
            Animated.timing(progress, {
                toValue: 1,
                duration: holdDuration,
                useNativeDriver: false,
            }),
            Animated.spring(scale, {
                toValue: 0.9,
                useNativeDriver: true,
            })
        ]).start();

        timerRef.current = setTimeout(() => {
            handleComplete();
        }, holdDuration);
    };

    const cancelHold = () => {
        setIsHolding(false);
        Vibration.cancel();
        if (timerRef.current) clearTimeout(timerRef.current);

        Animated.parallel([
            Animated.timing(progress, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }),
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
            })
        ]).start();
    };

    const handleComplete = () => {
        Vibration.cancel();
        Vibration.vibrate(500);
        onTrigger();
        cancelHold();
    };

    const progressWidth = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%']
    });

    const pulseOpacity = pulseAnim.interpolate({
        inputRange: [1, 1.25],
        outputRange: [0.25, 0],
    });

    return (
        <View style={styles.container}>
            {/* Outer pulse rings */}
            <Animated.View style={[styles.pulseRing, styles.pulseRingOuter, {
                transform: [{ scale: pulseAnim }],
                opacity: pulseOpacity,
            }]} />
            <Animated.View style={[styles.pulseRing, styles.pulseRingInner, {
                transform: [{ scale: Animated.multiply(pulseAnim, 0.85) }],
                opacity: pulseOpacity,
            }]} />

            <TouchableWithoutFeedback
                onPressIn={startHold}
                onPressOut={cancelHold}
            >
                <Animated.View style={[styles.button, { transform: [{ scale }] }]}>
                    <Text style={styles.buttonText}>{isHolding ? 'HOLDING...' : 'SOS'}</Text>
                    <Text style={styles.buttonSubtext}>{isHolding ? '' : 'Hold 3s'}</Text>

                    {isHolding && (
                        <View style={styles.progressBarContainer}>
                            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
                        </View>
                    )}
                </Animated.View>
            </TouchableWithoutFeedback>
            <Text style={styles.hint}>Hold for 3 seconds in emergency</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 220,
    },
    pulseRing: {
        position: 'absolute',
        borderRadius: 999,
        borderWidth: 2,
        borderColor: Colors.sosPrimary,
    },
    pulseRingOuter: {
        width: 210,
        height: 210,
    },
    pulseRingInner: {
        width: 195,
        height: 195,
    },
    button: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: Colors.sosPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.glow(Colors.sosPrimary),
        borderWidth: 4,
        borderColor: 'rgba(255,45,85,0.3)',
        overflow: 'hidden',
    },
    buttonText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 2,
        textAlign: 'center',
    },
    buttonSubtext: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    hint: {
        marginTop: 20,
        color: Colors.textMuted,
        ...Typography.caption,
    },
    progressBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#fff',
    },
});
