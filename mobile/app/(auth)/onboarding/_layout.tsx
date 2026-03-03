import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
            <Stack.Screen name="Step1_Permissions" />
            <Stack.Screen name="Step2_Contacts" />
            <Stack.Screen name="Step3_Addresses" />
            <Stack.Screen name="Step4_Preferences" />
            <Stack.Screen name="Step5_FakeCall" />
        </Stack>
    );
}
