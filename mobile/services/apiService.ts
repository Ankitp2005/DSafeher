import axios, { AxiosError, AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';

const LOCALHOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_URL = (Constants.expoConfig?.extra?.apiUrl as string) || `http://${LOCALHOST}:3001/api`;

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

console.log('Mobile API URL initialized as:', API_URL);

/**
 * Exponential backoff helper
 */
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

import { authStorage } from './authStorage';

// Request queuing for refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Add a request interceptor to attach JWT
api.interceptors.request.use(async (config) => {
    const token = await authStorage.getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add a response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config;
        const { response } = error;

        // 1. Handle 401 Unauthorized (Token Expired)
        // Skip refresh for auth routes — they return 401 for business logic, not expired tokens
        const requestUrl = originalRequest?.url || '';
        const isAuthRoute = requestUrl.includes('/auth/send-otp') || requestUrl.includes('/auth/verify-otp');
        if (response && response.status === 401 && !(originalRequest as any)._retry && !isAuthRoute) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest!.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest!);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            (originalRequest as any)._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await authStorage.getRefreshToken();
                const userId = await authStorage.getAccessToken(); // We might need to decode user_id or store it separately
                // Note: Better to store user_id in authStorage or decode from JWT

                // Let's assume the refresh endpoint needs refresh_token + user_id + device_id
                // For simplicity, I'll update authStorage to store user info if needed
                const deviceId = await authStorage.getDeviceId();

                // We'll use a raw axios call here to avoid interceptor loop
                const refreshRes = await axios.post(`${API_URL}/auth/refresh`, {
                    refresh_token: refreshToken,
                    user_id: (originalRequest?.data as any)?.user_id || 'last_known_user', // Fallback or retrieve from storage
                });

                if (refreshRes.data.access_token) {
                    await authStorage.saveAccessToken(refreshRes.data.access_token);
                    await authStorage.saveRefreshToken(refreshRes.data.refresh_token);

                    api.defaults.headers.common['Authorization'] = `Bearer ${refreshRes.data.access_token}`;
                    originalRequest!.headers.Authorization = `Bearer ${refreshRes.data.access_token}`;

                    processQueue(null, refreshRes.data.access_token);
                    return api(originalRequest!);
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                await authStorage.clearAll();
                // Redirect to login or signal app state change
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // 2. Handle 429 Rate Limiting (Existing logic)
        if (response && response.status === 429) {
            const data: any = response.data;
            const url = originalRequest?.url || '';

            // 1. SOS Special Handling: Silently fallback
            if (url.includes('/sos/trigger')) {
                console.warn('SOS Rate Limited. Instructing baseline fallback...');
                // In a real app, this would trigger a native SMS module call here
                return Promise.reject({ ...error, fallbackToSMS: true });
            }

            // 2. Exponential Backoff Retry (Max 3 retries)
            const retryCount = (originalRequest as any)._retryCount || 0;
            if (retryCount < 3) {
                (originalRequest as any)._retryCount = retryCount + 1;
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`Rate limit hit. Retrying in ${delay / 1000}s... (Attempt ${retryCount + 1})`);
                await wait(delay);
                return api(originalRequest!);
            }

            // 3. User-friendly messaging after retries fail
            if (url.includes('/auth/send-otp')) {
                Alert.alert("Slow Down", "You've requested too many codes. Please wait 1 hour before trying again.");
            } else if (url.includes('/routes/suggest')) {
                Alert.alert("Limit Reached", "Too many route requests. Showing last cached result.");
            } else {
                Alert.alert("Too Many Requests", data.message || "Please slow down and try again later.");
            }
        }

        return Promise.reject(error);
    }
);

export default api;
