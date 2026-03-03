import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Props {
    callerName: string;
    onEndCall: () => void;
}

export const FakeCallActiveScreen: React.FC<Props> = ({ callerName, onEndCall }) => {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.topSection}>
                <View style={styles.avatar} />
                <Text style={styles.callerName}>{callerName}</Text>
                <Text style={styles.timerText}>{formatTime(seconds)}</Text>
            </View>

            <View style={styles.keypadGrid}>
                <View style={styles.row}>
                    <View style={styles.btnDummy}><Text style={styles.btnText}>mute</Text></View>
                    <View style={styles.btnDummy}><Text style={styles.btnText}>keypad</Text></View>
                    <View style={styles.btnDummy}><Text style={styles.btnText}>audio</Text></View>
                </View>
                <View style={styles.row}>
                    <View style={styles.btnDummy}><Text style={styles.btnText}>add call</Text></View>
                    <View style={styles.btnDummy}><Text style={styles.btnText}>FaceTime</Text></View>
                    <View style={styles.btnDummy}><Text style={styles.btnText}>contacts</Text></View>
                </View>
            </View>

            <View style={styles.bottomSection}>
                <TouchableOpacity style={styles.endBtn} onPress={onEndCall}>
                    <Text style={styles.iconText}>📞</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute', top: 0, left: 0, width, height,
        backgroundColor: '#1c1c1e',
        zIndex: 9999,
        justifyContent: 'space-between',
        paddingTop: 80, paddingBottom: 60
    },
    topSection: { alignItems: 'center' },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#3a3a3c', marginBottom: 16 },
    callerName: { color: '#fff', fontSize: 32, fontWeight: '400', marginBottom: 8 },
    timerText: { color: '#8e8e93', fontSize: 18 },
    keypadGrid: { paddingHorizontal: 40, gap: 24, marginTop: 40 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    btnDummy: { width: 75, height: 75, borderRadius: 37.5, backgroundColor: '#333336', justifyContent: 'center', alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 12 },
    bottomSection: { alignItems: 'center' },
    endBtn: { width: 75, height: 75, borderRadius: 37.5, backgroundColor: '#ff3b30', justifyContent: 'center', alignItems: 'center' },
    iconText: { color: '#fff', fontSize: 32, transform: [{ rotate: '135deg' }] } // Upside down phone icon
});
