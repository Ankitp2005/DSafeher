import * as Device from 'expo-device';
import { Alert } from 'react-native';

export const securityService = {
    /**
     * Checks if the device is rooted (Android) or jailbroken (iOS)
     */
    async checkDeviceIntegrity(): Promise<boolean> {
        const isRooted = await Device.isRootedExperimentalAsync();

        if (isRooted) {
            console.warn('Security Warning: Device appears to be rooted/jailbroken');
            // We return false to indicate integrity is compromised
            return false;
        }

        return true;
    },

    /**
     * Detects if the app is running on an emulator in production
     */
    isEmulator(): boolean {
        return !Device.isDevice;
    },

    /**
     * Performs a full security audit on launch
     */
    async performSecurityCheck(): Promise<void> {
        const isSecure = await this.checkDeviceIntegrity();
        const onEmulator = this.isEmulator();

        if (!isSecure) {
            Alert.alert(
                'Security Warning',
                'Your device security is compromised (rooted/jailbroken). SafeHer will continue to work, but your data may be at risk.',
                [{ text: 'I Understand' }]
            );
        }

        if (onEmulator && !__DEV__) {
            Alert.alert(
                'Emulator Detected',
                'Running SafeHer on an emulator in production is not recommended for security reasons.',
                [{ text: 'OK' }]
            );
        }
    }
};
