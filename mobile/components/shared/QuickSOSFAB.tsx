import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { sosService } from '../../services/sosService';
import { SOSCountdownModal } from '../sos/SOSCountdownModal';

export const QuickSOSFAB = () => {
    const router = useRouter();
    const [isCounting, setIsCounting] = React.useState(false);

    const handleLongPress = () => {
        setIsCounting(true);
    };

    const handleConfirm = () => {
        setIsCounting(false);
        sosService.triggerSOS('button');
        router.push('/'); // Route them back home where the active SOS is handled
    };

    const handleCancel = () => {
        setIsCounting(false);
    };

    return (
        <View style={styles.fabContainer}>
            <TouchableOpacity
                style={styles.fabBtn}
                onLongPress={handleLongPress}
                delayLongPress={500}
                activeOpacity={0.8}
            >
                <Ionicons name="call" size={20} color="white" />
                <View style={styles.shieldOverlay}>
                    <Ionicons name="shield" size={12} color="white" />
                </View>
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
        bottom: 86, // Above typical bottom tab bar
        right: 20,
        zIndex: 9999,
        elevation: 10,
    },
    fabBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ef4444',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 10,
    },
    shieldOverlay: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: '#b91c1c',
        borderRadius: 10,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fff',
    }
});
