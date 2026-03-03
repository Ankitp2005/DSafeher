import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Switch, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/settingsStore';

export default function SettingsScreen() {
    const router = useRouter();
    const {
        isDisguised, setDisguised,
        usePowerButton, setUsePowerButton,
        useShake, setUseShake
    } = useSettingsStore();

    // Local-only UI states for features not yet in store
    const [shareLocation, setShareLocation] = useState(true);
    const [sendPushAuto, setSendPushAuto] = useState(true);
    const [autoRecordAudio, setAutoRecordAudio] = useState(false);
    const [autoTakePhotos, setAutoTakePhotos] = useState(false);
    const [nightModeActive, setNightModeActive] = useState(true);

    const handleDisguiseApp = () => {
        if (isDisguised) {
            setDisguised(false);
            Alert.alert("Disguise Disabled", "SafeHer icon restored.");
            return;
        }

        Alert.alert(
            "Disguise App",
            "This will change the app entry to a 'Calculator'. You will need a secret code to enter the real SafeHer app mode.\n\nAre you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Enable Disguise", onPress: () => {
                        setDisguised(true);
                        Alert.alert("Disguise Enabled", "App is now in stealth mode. Use your secret code to enter.");
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "This action is permanent and will delete all your data, location history, and account details within 30 days.\n\nProceed?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => Alert.alert("Account Scheduled for Deletion") }
            ]
        );
    }

    const SectionHeader = ({ title }: { title: string }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );

    const ToggleItem = ({ icon, title, value, onValueChange, description }: any) => (
        <View style={styles.listItem}>
            <View style={styles.itemIconContainer}>
                <Ionicons name={icon} size={22} color="#4b5563" />
            </View>
            <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{title}</Text>
                {description && <Text style={styles.itemDesc}>{description}</Text>}
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#d1d5db', true: '#fca5a5' }}
                thumbColor={value ? '#ef4444' : '#f3f4f6'}
            />
        </View>
    );

    const NavigationItem = ({ icon, title, description, onPress, color = '#4b5563', destColor = '#4b5563' }: any) => (
        <TouchableOpacity style={styles.listItem} onPress={onPress}>
            <View style={styles.itemIconContainer}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: destColor }]}>{title}</Text>
                {description && <Text style={styles.itemDesc}>{description}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>

                <SectionHeader title="SOS Triggers" />
                <ToggleItem
                    icon="power"
                    title="Power Button (5x Press)"
                    description="Press the physical power button 5 times quickly to trigger SOS stealthily."
                    value={usePowerButton}
                    onValueChange={setUsePowerButton}
                />
                <ToggleItem
                    icon="phone-portrait"
                    title="Shake Device"
                    description="Shake your phone vigorously 3 times to trigger SOS without unlocking."
                    value={useShake}
                    onValueChange={setUseShake}
                />

                <SectionHeader title="Privacy & Evidence" />
                <ToggleItem
                    icon="location"
                    title="Share Live Location"
                    description="Always share background location during an active SOS."
                    value={shareLocation}
                    onValueChange={setShareLocation}
                />
                <ToggleItem
                    icon="mic"
                    title="Auto-Record Audio"
                    description="Covertly record audio when SOS is triggered. Encrypted locally."
                    value={autoRecordAudio}
                    onValueChange={setAutoRecordAudio}
                />
                <ToggleItem
                    icon="camera"
                    title="Auto-Take Photos"
                    description="Covertly take front-camera photos every 30s during active SOS."
                    value={autoTakePhotos}
                    onValueChange={setAutoTakePhotos}
                />

                <SectionHeader title="Account & Profile" />
                <NavigationItem
                    icon="person"
                    title="Edit Profile"
                    onPress={() => { }}
                />
                <NavigationItem
                    icon="home"
                    title="Home & Work Address"
                    description="Manage your encrypted frequent addresses."
                    onPress={() => { }}
                />
                <NavigationItem
                    icon="people"
                    title="Emergency Contacts"
                    description="Manage who gets alerted when you need help."
                    onPress={() => { }}
                />
                <NavigationItem
                    icon="language"
                    title="Language Preferences"
                    description="English, Hindi, Tamil, Telugu, Marathi"
                    onPress={() => { }}
                />

                <SectionHeader title="Advanced Safety" />
                <ToggleItem
                    icon="moon"
                    title="Smart Night Mode"
                    description="Heightened safety alerts and check-in suggestions after 9 PM."
                    value={nightModeActive}
                    onValueChange={setNightModeActive}
                />
                <NavigationItem
                    icon="calculator"
                    title={isDisguised ? "Disable App Disguise" : "Disguise App as Calculator"}
                    description={isDisguised ? "Currently in stealth mode." : "Hide SafeHer inside a working calculator app. Perfect for abusive living situations."}
                    color={isDisguised ? "#ef4444" : "#4f46e5"}
                    destColor={isDisguised ? "#ef4444" : "#4f46e5"}
                    onPress={handleDisguiseApp}
                />

                <SectionHeader title="Data Controls" />
                <NavigationItem
                    icon="download"
                    title="Export My Data (GDPR)"
                    onPress={() => Alert.alert("Data Export Started", "You will receive an email shortly with a download link.")}
                />
                <NavigationItem
                    icon="trash"
                    title="Delete Account"
                    color="#ef4444"
                    destColor="#ef4444"
                    onPress={handleDeleteAccount}
                />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>SafeHer v1.0.0</Text>
                    <Text style={styles.footerText}>Made with ❤️ for women's safety</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    backBtn: {
        padding: 4,
    },
    content: {
        flex: 1,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6b7280',
        textTransform: 'uppercase',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    itemIconContainer: {
        width: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    itemContent: {
        flex: 1,
        justifyContent: 'center',
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    itemDesc: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 2,
        paddingRight: 16,
    },
    footer: {
        padding: 30,
        alignItems: 'center',
        marginBottom: 20,
    },
    footerText: {
        color: '#9ca3af',
        fontSize: 12,
        marginBottom: 4,
    }
});
