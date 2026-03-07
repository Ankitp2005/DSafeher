import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Typography, Radius, Spacing, GlassCard } from '../../constants/theme';

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
        } catch (err) { }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.bgPrimary} />

            {/* Back */}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.headerSection}>
                <View style={styles.iconCircle}>
                    <Ionicons name="chatbubble-ellipses" size={28} color={Colors.accentPrimary} />
                </View>
                <Text style={styles.title}>Verify OTP</Text>
                <Text style={styles.subtitle}>
                    Enter the 6-digit code sent to{'\n'}
                    <Text style={styles.phoneHighlight}>{phone}</Text>
                </Text>
            </View>

            <View style={styles.card}>
                <TextInput
                    style={styles.otpInput}
                    keyboardType="number-pad"
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="• • • • • •"
                    placeholderTextColor={Colors.textMuted}
                    maxLength={6}
                    autoFocus
                />

                {error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                <TouchableOpacity
                    style={[styles.button, otp.length !== 6 && styles.buttonDisabled]}
                    onPress={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={otp.length === 6 ? Colors.accentGradient : ['#E8E0F0', '#DDD5E5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>Verify Code</Text>
                                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <View style={styles.resendContainer}>
                {countdown > 0 ? (
                    <Text style={styles.resendText}>
                        Resend code in <Text style={styles.countdownNum}>{countdown}s</Text>
                    </Text>
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
    container: {
        flex: 1,
        backgroundColor: Colors.bgPrimary,
        padding: Spacing.xxl,
        justifyContent: 'center',
    },
    backBtn: {
        position: 'absolute',
        top: 56,
        left: Spacing.xxl,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.bgCard,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.borderCard,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(214,36,110,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(214,36,110,0.2)',
    },
    title: {
        ...Typography.h1,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        ...Typography.body,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    phoneHighlight: {
        color: Colors.accentPrimary,
        fontWeight: '700',
    },
    card: {
        ...GlassCard,
        padding: Spacing.xxl,
    },
    otpInput: {
        fontSize: 32,
        letterSpacing: 12,
        color: Colors.textPrimary,
        textAlign: 'center',
        paddingVertical: Spacing.lg,
        borderBottomWidth: 2,
        borderBottomColor: Colors.accentPrimary,
        fontWeight: '700',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    errorText: {
        color: Colors.danger,
        fontSize: 13,
    },
    button: {
        marginTop: Spacing.xxl,
        borderRadius: Radius.md,
        overflow: 'hidden',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: Spacing.sm,
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    resendContainer: {
        marginTop: Spacing.xxl,
        alignItems: 'center',
    },
    resendText: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    countdownNum: {
        color: Colors.accentPrimary,
        fontWeight: '700',
    },
    resendLink: {
        color: Colors.accentPrimary,
        fontWeight: '700',
        fontSize: 15,
    },
});
