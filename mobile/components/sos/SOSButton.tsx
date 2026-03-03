import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableWithoutFeedback, Vibration } from 'react-native';

interface SOSButtonProps {
    onTrigger: () => void;
    holdDuration?: number;
}

export const SOSButton: React.FC<SOSButtonProps> = ({ onTrigger, holdDuration = 3000 }) => {
    const [isHolding, setIsHolding] = useState(false);
    const progress = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;
    const timerRef = useRef<NodeJS.Timeout | null>(null);

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

    return (
        <View style={styles.container}>
            <TouchableWithoutFeedback
                onPressIn={startHold}
                onPressOut={cancelHold}
            >
                <Animated.View style={[styles.button, { transform: [{ scale }] }]}>
                    <Text style={styles.buttonText}>{isHolding ? 'HOLDING...' : 'HOLD FOR SOS'}</Text>

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
    },
    button: {
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: '#e53e3e',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
        borderWidth: 8,
        borderColor: 'rgba(255,255,255,0.2)',
        overflow: 'hidden'
    },
    buttonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    hint: {
        marginTop: 16,
        color: '#718096',
        fontSize: 14,
        fontWeight: '500'
    },
    progressBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#fff',
    }
});
