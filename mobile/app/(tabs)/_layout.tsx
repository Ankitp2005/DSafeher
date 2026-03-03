import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { QuickSOSFAB } from '../../components/shared/QuickSOSFAB';

export default function TabLayout() {
    return (
        <>
            <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#e53e3e' }}>
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
                    }}
                />
                <Tabs.Screen
                    name="routes"
                    options={{
                        title: 'Routes',
                        tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />
                    }}
                />
                <Tabs.Screen
                    name="community"
                    options={{
                        title: 'Community',
                        tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />
                    }}
                />
                <Tabs.Screen
                    name="fake-call"
                    options={{
                        title: 'Fake Call',
                        tabBarIcon: ({ color }) => <Ionicons name="call" size={24} color={color} />
                    }}
                />
                <Tabs.Screen
                    name="check-in"
                    options={{
                        title: 'Check In',
                        tabBarIcon: ({ color }) => <Ionicons name="location" size={24} color={color} />
                    }}
                />
                <Tabs.Screen
                    name="check-in-history"
                    options={{
                        href: null,
                    }}
                />
            </Tabs>
            <QuickSOSFAB />
        </>
    );
}
