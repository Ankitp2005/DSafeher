import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Accelerometer } from 'expo-sensors';
import { locationService } from './locationService';
import { evidenceService } from './evidenceService';

const LOCALHOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_URL = (process.env.EXPO_PUBLIC_API_URL as string) || `http://${LOCALHOST}:3001/api`;
const SHAKE_THRESHOLD = 2.5; // Adjusted for sensitivity

let lastShake = 0;
let accelerometerSubscription: any = null;

export const sosService = {
    triggerSOS: async (triggerType: 'button' | 'shake' | 'power_click' | 'threat_detection') => {
        try {
            const token = await SecureStore.getItemAsync('access_token');

            const response = await fetch(`${API_URL}/sos/trigger`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ trigger_type: triggerType })
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to trigger SOS');

            await locationService.startSOSTracking(data.alert_id);
            await evidenceService.startAudioRecording(data.alert_id);
            return data;
        } catch (err) {
            console.error('triggerSOS Err:', err);
            throw err;
        }
    },

    resolveSOS: async (alertId: string) => {
        try {
            const token = await SecureStore.getItemAsync('access_token');
            await fetch(`${API_URL}/sos/${alertId}/resolve`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            await locationService.stopSOSTracking();
            await evidenceService.stopAllRecording(alertId);
        } catch (err) {
            console.error('resolveSOS Err', err);
        }
    },

    initializeTriggers: (onTrigger: () => void) => {
        // --- 1. Accelerometer / Shake detection ---
        if (accelerometerSubscription) {
            accelerometerSubscription.remove();
        }

        Accelerometer.setUpdateInterval(100);
        accelerometerSubscription = Accelerometer.addListener(data => {
            const { x, y, z } = data;
            const acceleration = Math.sqrt(x * x + y * y + z * z);

            if (acceleration > SHAKE_THRESHOLD) {
                const now = Date.now();
                if (now - lastShake > 1000) { // 1 second cooldown
                    lastShake = now;
                    onTrigger();
                }
            }
        });

        // Return cleanup function
        return () => {
            if (accelerometerSubscription) {
                accelerometerSubscription.remove();
                accelerometerSubscription = null;
            }
        };
    },

    getActiveAlert: async (alertId: string) => {
        try {
            const token = await SecureStore.getItemAsync('access_token');
            const response = await fetch(`${API_URL}/sos/${alertId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to fetch alert details');
            return data;
        } catch (err) {
            console.error('getActiveAlert Err:', err);
            throw err;
        }
    }
};
