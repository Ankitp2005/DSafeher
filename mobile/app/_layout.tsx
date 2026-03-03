import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useFakeCallStore } from '../store/fakeCallStore';
import { FakeCallIncomingScreen } from '../components/sos/FakeCallIncomingScreen';
import { FakeCallActiveScreen } from '../components/sos/FakeCallActiveScreen';
import { threatDetectionService } from '../services/threatDetectionService';
import { Alert } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export default function RootLayout() {
    const { status, callerName, setStatus, setCallerName, endCall } = useFakeCallStore();

    useEffect(() => {
        // Listen for notification interactions (when user taps the notification)
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (data.type === 'fake_call') {
                setCallerName(data.callerName || 'Mom');
                setStatus('incoming');
            }
        });

        // Listen for incoming notifications while app is in foreground
        const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
            const data = notification.request.content.data;
            if (data.type === 'fake_call') {
                setCallerName(data.callerName || 'Mom');
                setStatus('incoming');
            } else if (data.type === 'safety_check') {
                Alert.alert(
                    "Safety Check",
                    notification.request.content.body || "Are you okay?",
                    [
                        { text: "I'm Safe", onPress: () => threatDetectionService.respondToCheck(true) },
                        { text: "I Need Help", style: 'destructive', onPress: () => threatDetectionService.respondToCheck(false) }
                    ]
                );
            }
        });

        // Start Proactive Safety Monitoring
        threatDetectionService.startMonitoring();

        return () => {
            subscription.remove();
            foregroundSubscription.remove();
            threatDetectionService.stopMonitoring();
        };
    }, []);

    return (
        <>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="disguise/calculator" />
                <Stack.Screen name="sos/active" options={{ presentation: 'fullScreenModal' }} />
            </Stack>

            {status === 'incoming' && (
                <FakeCallIncomingScreen
                    callerName={callerName}
                    onAccept={() => setStatus('active')}
                    onDecline={endCall}
                />
            )}

            {status === 'active' && (
                <FakeCallActiveScreen
                    callerName={callerName}
                    onEndCall={endCall}
                />
            )}
        </>
    );
}
