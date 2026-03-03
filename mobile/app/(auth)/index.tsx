import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '../../services/authService';

export default function PhoneInputScreen() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSendOTP = async () => {
        if (phoneNumber.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }
        setError('');
        setLoading(true);

        try {
            // Auto-prefix country code for demo purposes
            const prefixedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

            await authService.sendOTP(prefixedNumber);

            router.push({
                pathname: '/verify',
                params: { phone: prefixedNumber }
            });
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Enter Phone Number</Text>
            <Text style={styles.subtitle}>We'll send you a 6-digit code</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.flag}>🇮🇳 +91</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
                    placeholder="Phone Number"
                    maxLength={10}
                />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
                style={[styles.button, phoneNumber.length !== 10 && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={loading || phoneNumber.length !== 10}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.buttonText}>Send OTP</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 32 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 8 },
    flag: { fontSize: 20, marginRight: 12 },
    input: { flex: 1, fontSize: 18, paddingVertical: 8 },
    errorText: { color: 'red', marginTop: 12 },
    button: { backgroundColor: '#e53e3e', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
    buttonDisabled: { backgroundColor: '#fc8181' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
