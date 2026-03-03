import * as LocalAuthentication from 'expo-local-authentication';
import { authStorage } from './authStorage';

export const biometricService = {
    /**
     * Checks if biometrics are supported and enrolled on the device
     */
    async isBiometricAvailable(): Promise<boolean> {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        return hasHardware && isEnrolled;
    },

    /**
     * Prompts the user for biometric authentication
     */
    async authenticate(): Promise<boolean> {
        try {
            const available = await this.isBiometricAvailable();
            if (!available) return false;

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirm identity to access SafeHer',
                fallbackLabel: 'Use PIN',
                cancelLabel: 'Cancel',
                disableDeviceFallback: false,
            });

            return result.success;
        } catch (error) {
            console.error('Biometric authentication failed:', error);
            return false;
        }
    },

    /**
     * Enables biometric requirement for the app
     */
    async setEnabled(enabled: boolean): Promise<void> {
        await authStorage.setBiometricEnabled(enabled);
    },

    /**
     * Checks if the user has enabled biometrics for this app
     */
    async isEnabled(): Promise<boolean> {
        return await authStorage.isBiometricEnabled();
    }
};
