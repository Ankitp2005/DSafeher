import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { authStorage } from './authStorage';
import api from './apiService';

export const authService = {
    sendOTP: async (phoneNumber: string) => {
        try {
            const response = await api.post('/auth/send-otp', { phone_number: phoneNumber });
            return response.data;
        } catch (error: any) {
            console.error('sendOTP Error:', error.response?.data || error.message);
            throw error;
        }
    },

    verifyOTP: async (phoneNumber: string, otp: string) => {
        try {
            const deviceId = Device.osBuildId || 'unknown_device';
            const deviceName = Device.deviceName || 'Mobile Device';

            const response = await api.post('/auth/verify-otp', {
                phone_number: phoneNumber,
                otp,
                device_id: deviceId,
                device_name: deviceName
            });

            const { access_token, refresh_token, user, is_new_user } = response.data;

            if (access_token) {
                await authStorage.saveAccessToken(access_token);
                await authStorage.saveRefreshToken(refresh_token);
                await authStorage.saveDeviceId(deviceId);
            }

            return response.data;
        } catch (error: any) {
            console.error('verifyOTP Error:', error.response?.data || error.message);
            throw error;
        }
    },

    logout: async () => {
        try {
            const accessToken = await authStorage.getAccessToken(); // Or get userId from decoded token
            // In a better design, we'd have the userId stored or decoded
            // For now, logout relies on the refresh token which handles revocation
            const refreshToken = await authStorage.getRefreshToken();

            await api.post('/auth/logout', { refresh_token: refreshToken });
            await authStorage.clearAll();
        } catch (error) {
            console.error('Logout error:', error);
            await authStorage.clearAll(); // Clear anyway
        }
    }
};
