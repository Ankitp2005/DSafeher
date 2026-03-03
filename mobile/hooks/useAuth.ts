import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

interface AuthState {
    isAuthenticated: boolean;
    user: any | null;
    isLoading: boolean;
    login: (userData: any) => void;
    logout: () => void;
    checkBiometricAuth: () => Promise<boolean>;
}

export const useAuth = create<AuthState>((set) => ({
    isAuthenticated: false,
    user: null,
    isLoading: false,

    login: (userData) => {
        set({ isAuthenticated: true, user: userData });
    },

    logout: async () => {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        set({ isAuthenticated: false, user: null });
    },

    checkBiometricAuth: async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) return true; // fallback to true if not supported

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to access SafeHer',
            fallbackLabel: 'Use Passcode',
            disableDeviceFallback: false,
        });

        return result.success;
    }
}));
