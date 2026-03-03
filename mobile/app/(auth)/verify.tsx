import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

export default function OTPVerificationScreen() {
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(45);

    const router = useRouter();
    const { login } = useAuth();

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) return;

        setLoading(true);
        setError('');

        try {
            const data = await authService.verifyOTP(phone, otp);
            login(data.user);

            if (data.is_new_user) {
                router.replace('/onboarding/Step1_Permissions');
            } else {
                router.replace('/(tabs)');
            }
        } catch (err: any) {
            setError(err.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setCountdown(45);
        try {
            await authService.sendOTP(phone);
        } catch (err) {
            // Handle error implicitly
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>Sent to {phone}</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={otp}
                    onChangeText={(val) => {
                        setOtp(val);
                        if (val.length === 6) {
                            // auto-submit workaround for simple UI
                        }
                    }}
                    placeholder="123456"
                    maxLength={6}
                    autoFocus
                />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
                style={[styles.button, otp.length !== 6 && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
            >
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Verify code</Text>}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
                {countdown > 0 ? (
                    <Text style={styles.resendText}>Resend in {countdown}s</Text>
                ) : (
                    <TouchableOpacity onPress={handleResend}>
                        <Text style={styles.resendLink}>Resend OTP</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 32 },
    inputContainer: { alignItems: 'center' },
    input: { fontSize: 32, letterSpacing: 8, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: '#e53e3e', textAlign: 'center' },
    errorText: { color: 'red', marginTop: 12, textAlign: 'center' },
    button: { backgroundColor: '#e53e3e', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 32 },
    buttonDisabled: { backgroundColor: '#fc8181' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    resendContainer: { marginTop: 24, alignItems: 'center' },
    resendText: { color: '#666' },
    resendLink: { color: '#e53e3e', fontWeight: 'bold' }
});
