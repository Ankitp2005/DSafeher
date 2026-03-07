import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { QuickSOSFAB } from '../../components/shared/QuickSOSFAB';
import { Colors } from '../../constants/theme';

export default function TabLayout() {
    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: Colors.tabActive,
                    tabBarInactiveTintColor: Colors.tabInactive,
                    tabBarStyle: {
                        backgroundColor: Colors.tabBarBg,
                        borderTopColor: Colors.tabBarBorder,
                        borderTopWidth: 1,
                        height: 64,
                        paddingBottom: 8,
                        paddingTop: 8,
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '600',
                        letterSpacing: 0.3,
                    },
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
                        )
                    }}
                />
                <Tabs.Screen
                    name="routes"
                    options={{
                        title: 'Routes',
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? "map" : "map-outline"} size={22} color={color} />
                        )
                    }}
                />
                <Tabs.Screen
                    name="community"
                    options={{
                        title: 'Community',
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? "people" : "people-outline"} size={22} color={color} />
                        )
                    }}
                />
                <Tabs.Screen
                    name="fake-call"
                    options={{
                        title: 'Fake Call',
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? "call" : "call-outline"} size={22} color={color} />
                        )
                    }}
                />
                <Tabs.Screen
                    name="check-in"
                    options={{
                        title: 'Check In',
                        tabBarIcon: ({ color, focused }) => (
                            <Ionicons name={focused ? "location" : "location-outline"} size={22} color={color} />
                        )
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
