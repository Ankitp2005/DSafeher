import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../store/settingsStore';

export default function CalculatorDisguise() {
    const [display, setDisplay] = useState('0');
    const [lastInput, setLastInput] = useState('');
    const router = useRouter();
    const { disguiseCode } = useSettingsStore();

    const handlePress = (val: string) => {
        let newDisplay = display === '0' ? val : display + val;
        setDisplay(newDisplay);

        const newInput = lastInput + val;
        setLastInput(newInput);

        // Check if the secret code sequence matches
        if (newInput.endsWith(disguiseCode)) {
            router.replace('/(auth)');
        }

        // Reset buffer if it gets too long
        if (newInput.length > 20) {
            setLastInput(val);
        }
    };

    const clear = () => {
        setDisplay('0');
        setLastInput('');
    };

    const calculate = () => {
        try {
            // Simplified eval-like logic for demo
            // eslint-disable-next-line no-eval
            const result = eval(display.replace('x', '*').replace('÷', '/'));
            setDisplay(String(result));
            setLastInput('');
        } catch (e) {
            setDisplay('Error');
        }
    };

    const Button = ({ label, type = 'num', flex = 1 }: { label: string, type?: 'num' | 'op' | 'action', flex?: number }) => (
        <TouchableOpacity
            style={[
                styles.button,
                type === 'op' && styles.opButton,
                type === 'action' && styles.actionButton,
                { flex }
            ]}
            onPress={() => {
                if (label === 'C') clear();
                else if (label === '=') calculate();
                else handlePress(label);
            }}
        >
            <Text style={[styles.buttonText, type !== 'num' && styles.opButtonText]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.displayContainer}>
                <Text style={styles.displayText} numberOfLines={1}>{display}</Text>
            </View>

            <View style={styles.row}>
                <Button label="C" type="action" />
                <Button label="+/-" type="action" />
                <Button label="%" type="action" />
                <Button label="÷" type="op" />
            </View>
            <View style={styles.row}>
                <Button label="7" />
                <Button label="8" />
                <Button label="9" />
                <Button label="x" type="op" />
            </View>
            <View style={styles.row}>
                <Button label="4" />
                <Button label="5" />
                <Button label="6" />
                <Button label="-" type="op" />
            </View>
            <View style={styles.row}>
                <Button label="1" />
                <Button label="2" />
                <Button label="3" />
                <Button label="+" type="op" />
            </View>
            <View style={styles.row}>
                <Button label="0" flex={2} />
                <Button label="." />
                <Button label="=" type="op" />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'flex-end',
        paddingBottom: 20,
    },
    displayContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        padding: 20,
    },
    displayText: {
        color: '#fff',
        fontSize: 80,
        fontWeight: '300',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#333',
        height: 80,
        width: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 32,
    },
    opButton: {
        backgroundColor: '#f09235',
    },
    opButtonText: {
        color: '#fff',
    },
    actionButton: {
        backgroundColor: '#a5a5a5',
    },
});
