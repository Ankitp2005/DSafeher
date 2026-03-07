import { Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as SecureStore from 'expo-secure-store';

const LOCATION_TASK_NAME = 'background-location-task';
const LOCALHOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${LOCALHOST}:3001/api`;

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error(error);
        return;
    }
    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        const latestLocation = locations[0];

        try {
            const alertId = await SecureStore.getItemAsync('sos_active_alert_id');
            const token = await SecureStore.getItemAsync('access_token');

            if (alertId && token) {
                await fetch(`${API_URL}/sos/${alertId}/location`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        latitude: latestLocation.coords.latitude,
                        longitude: latestLocation.coords.longitude,
                        accuracy: latestLocation.coords.accuracy,
                        speed: latestLocation.coords.speed,
                        heading: latestLocation.coords.heading,
                        battery_level: 100 // Mock battery for now
                    })
                });
            }
        } catch (err) {
            console.log('Failed to upload location', err);
        }
    }
});

export const locationService = {
    startSOSTracking: async (alertId: string) => {
        // Save alertId so background task can access it
        await SecureStore.setItemAsync('sos_active_alert_id', alertId);

        // Register background task
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 10000,
            deferredUpdatesInterval: 10000,
            distanceInterval: 10,
            showsBackgroundLocationIndicator: true,
            foregroundService: {
                notificationTitle: "SafeHer SOS Active",
                notificationBody: "Live location is being shared with emergency contacts",
                notificationColor: "#e53e3e",
            }
        });
    },

    stopSOSTracking: async () => {
        await SecureStore.deleteItemAsync('sos_active_alert_id');
        const hasTask = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
        if (hasTask) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }
    }
};

