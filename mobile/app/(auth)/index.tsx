import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../../services/authService';
import { Colors, Typography, Radius, Spacing, GlassCard } from '../../constants/theme';

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
            <StatusBar barStyle="dark-content" backgroundColor={Colors.bgPrimary} />

            {/* Header */}
            <View style={styles.brandContainer}>
                <View style={styles.logoCircle}>
                    <Ionicons name="shield-checkmark" size={36} color={Colors.accentPrimary} />
                </View>
                <Text style={styles.brandName}>SafeHer</Text>
                <Text style={styles.tagline}>Your safety, always on</Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
                <Text style={styles.title}>Enter Phone Number</Text>
                <Text style={styles.subtitle}>We'll send you a 6-digit verification code</Text>

                <View style={styles.inputContainer}>
                    <View style={styles.flagBox}>
                        <Text style={styles.flag}>🇮🇳</Text>
                        <Text style={styles.countryCode}>+91</Text>
                    </View>
                    <View style={styles.divider} />
                    <TextInput
                        style={styles.input}
                        keyboardType="phone-pad"
                        value={phoneNumber}
                        onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
                        placeholder="Phone Number"
                        placeholderTextColor={Colors.textMuted}
                        maxLength={10}
                    />
                </View>

                {error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                <TouchableOpacity
                    style={[styles.button, phoneNumber.length !== 10 && styles.buttonDisabled]}
                    onPress={handleSendOTP}
                    disabled={loading || phoneNumber.length !== 10}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={phoneNumber.length === 10 ? Colors.accentGradient : ['#E8E0F0', '#DDD5E5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>Send OTP</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <Text style={styles.footerText}>
                By continuing, you agree to our Terms of Service
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgPrimary,
        justifyContent: 'center',
        padding: Spacing.xxl,
    },
    brandContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(214,36,110,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(214,36,110,0.2)',
    },
    brandName: {
        ...Typography.hero,
        color: Colors.textPrimary,
    },
    tagline: {
        ...Typography.caption,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    card: {
        ...GlassCard,
        padding: Spacing.xxl,
    },
    title: {
        ...Typography.h2,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        ...Typography.body,
        color: Colors.textSecondary,
        marginBottom: Spacing.xxl,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.bgInput,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.borderInput,
        height: 56,
        paddingHorizontal: Spacing.lg,
    },
    flagBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    flag: {
        fontSize: 20,
    },
    countryCode: {
        ...Typography.bodyBold,
        color: Colors.textPrimary,
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: Colors.borderInput,
        marginHorizontal: Spacing.md,
    },
    input: {
        flex: 1,
        fontSize: 17,
        color: Colors.textPrimary,
        fontWeight: '500',
        letterSpacing: 1,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.md,
        paddingHorizontal: Spacing.xs,
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
    footerText: {
        ...Typography.small,
        color: Colors.textMuted,
        textAlign: 'center',
        marginTop: Spacing.xxl,
    },
});
