import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'safeher_access_token';
const REFRESH_TOKEN_KEY = 'safeher_refresh_token';
const BIOMETRIC_ENABLED_KEY = 'safeher_biometric_enabled';
const DEVICE_ID_KEY = 'safeher_device_id';

export const authStorage = {
    async saveAccessToken(token: string): Promise<void> {
        try {
            await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
        } catch (error) {
            console.error('Error saving access token:', error);
            throw new Error('Secure storage failed');
        }
    },

    async getAccessToken(): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        } catch (error) {
            console.error('Error getting access token:', error);
            return null;
        }
    },

    async saveRefreshToken(token: string): Promise<void> {
        try {
            await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
        } catch (error) {
            console.error('Error saving refresh token:', error);
            throw new Error('Secure storage failed');
        }
    },

    async getRefreshToken(): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        } catch (error) {
            console.error('Error getting refresh token:', error);
            return null;
        }
    },

    async saveDeviceId(deviceId: string): Promise<void> {
        await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    },

    async getDeviceId(): Promise<string | null> {
        return await SecureStore.getItemAsync(DEVICE_ID_KEY);
    },

    async setBiometricEnabled(enabled: boolean): Promise<void> {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled.toString());
    },

    async isBiometricEnabled(): Promise<boolean> {
        const value = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
        return value === 'true';
    },

    async clearAll(): Promise<void> {
        try {
            await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
            // We keep Biometric preference and Device ID for consistency
        } catch (error) {
            console.error('Error clearing secure storage:', error);
        }
    }
};
