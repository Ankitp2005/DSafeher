import { useFakeCallStore } from '../store/fakeCallStore';
import { Accelerometer } from 'expo-sensors';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// In a real app we'd trigger a native module for a true OS-level call UI
// if the app is backgrounded. For Expo Go / MVP, we use Local Push Notifications.

export const fakeCallService = {
    scheduleFakeCall: async (delaySeconds: number, config: { callerName: string }) => {
        if (delaySeconds === 0) {
            useFakeCallStore.getState().setCallerName(config.callerName);
            useFakeCallStore.getState().setStatus('incoming');
            return;
        }

        // Request permissions if not already granted
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            alert('Notification permissions are required to schedule a Fake Call in the background.');
            return;
        }

        // Schedule local notification
        await Notifications.scheduleNotificationAsync({
            content: {
                title: `Incoming Call...`,
                body: `${config.callerName} is calling you. Tap to view.`,
                sound: true, // Use default notification sound or custom ringtone if configured in app.json
                data: { type: 'fake_call', callerName: config.callerName },
            },
            trigger: { seconds: delaySeconds },
        });

        console.log(`Fake call scheduled in ${delaySeconds} seconds.`);
    },

    initializeShakeTrigger: () => {
        // This is now handled in the Home Screen index.tsx to prevent SOS/FakeCall conflicts
        console.log('Using centralized shake detection in HomeScreen');
        return () => { };
    },

    cancelFakeCall: async () => {
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('Fake call cancelled.');
    }
};
