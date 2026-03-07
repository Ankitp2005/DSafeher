import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Switch, Alert, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/settingsStore';
import { Colors, Typography, Radius, Spacing, GlassCard } from '../constants/theme';

export default function SettingsScreen() {
    const router = useRouter();
    const {
        isDisguised, setDisguised,
        usePowerButton, setUsePowerButton,
        useShake, setUseShake
    } = useSettingsStore();

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
                { text: "Enable Disguise", onPress: () => { setDisguised(true); Alert.alert("Disguise Enabled", "App is now in stealth mode."); } }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "This action is permanent and will delete all your data within 30 days.\n\nProceed?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => Alert.alert("Account Scheduled for Deletion") }
            ]
        );
    };

    const SectionHeader = ({ title }: { title: string }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );

    const ToggleItem = ({ icon, title, value, onValueChange, description }: any) => (
        <View style={styles.listItem}>
            <View style={styles.itemIconContainer}>
                <Ionicons name={icon} size={20} color={Colors.accentPrimary} />
            </View>
            <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{title}</Text>
                {description && <Text style={styles.itemDesc}>{description}</Text>}
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#E8E0F0', true: 'rgba(214,36,110,0.3)' }}
                thumbColor={value ? Colors.accentPrimary : Colors.textMuted}
            />
        </View>
    );

    const NavigationItem = ({ icon, title, description, onPress, color, destColor }: any) => (
        <TouchableOpacity style={styles.listItem} onPress={onPress}>
            <View style={styles.itemIconContainer}>
                <Ionicons name={icon} size={20} color={color || Colors.accentPrimary} />
            </View>
            <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, destColor && { color: destColor }]}>{title}</Text>
                {description && <Text style={styles.itemDesc}>{description}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.bgPrimary} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 22 }} />
            </View>

            <ScrollView style={styles.content}>
                <SectionHeader title="SOS Triggers" />
                <ToggleItem icon="power" title="Power Button (5x Press)" description="Press the power button 5 times quickly to trigger SOS." value={usePowerButton} onValueChange={setUsePowerButton} />
                <ToggleItem icon="phone-portrait" title="Shake Device" description="Shake your phone vigorously to trigger SOS." value={useShake} onValueChange={setUseShake} />

                <SectionHeader title="Privacy & Evidence" />
                <ToggleItem icon="location" title="Share Live Location" description="Always share background location during an active SOS." value={shareLocation} onValueChange={setShareLocation} />
                <ToggleItem icon="mic" title="Auto-Record Audio" description="Covertly record audio when SOS is triggered." value={autoRecordAudio} onValueChange={setAutoRecordAudio} />
                <ToggleItem icon="camera" title="Auto-Take Photos" description="Take front-camera photos every 30s during active SOS." value={autoTakePhotos} onValueChange={setAutoTakePhotos} />

                <SectionHeader title="Account & Profile" />
                <NavigationItem icon="person" title="Edit Profile" onPress={() => { }} />
                <NavigationItem icon="home" title="Home & Work Address" description="Manage your encrypted frequent addresses." onPress={() => { }} />
                <NavigationItem icon="people" title="Emergency Contacts" description="Manage who gets alerted." onPress={() => { }} />
                <NavigationItem icon="language" title="Language Preferences" description="English, Hindi, Tamil, Telugu, Marathi" onPress={() => { }} />

                <SectionHeader title="Advanced Safety" />
                <ToggleItem icon="moon" title="Smart Night Mode" description="Heightened safety alerts after 9 PM." value={nightModeActive} onValueChange={setNightModeActive} />
                <NavigationItem
                    icon="calculator"
                    title={isDisguised ? "Disable App Disguise" : "Disguise App as Calculator"}
                    description={isDisguised ? "Currently in stealth mode." : "Hide SafeHer inside a working calculator app."}
                    color={isDisguised ? Colors.danger : Colors.info}
                    destColor={isDisguised ? Colors.danger : Colors.info}
                    onPress={handleDisguiseApp}
                />

                <SectionHeader title="Data Controls" />
                <NavigationItem icon="download" title="Export My Data (GDPR)" onPress={() => Alert.alert("Data Export Started", "You will receive an email shortly.")} />
                <NavigationItem icon="trash" title="Delete Account" color={Colors.danger} destColor={Colors.danger} onPress={handleDeleteAccount} />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>SafeHer v1.0.0</Text>
                    <Text style={styles.footerText}>Made with ❤️ for women's safety</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bgPrimary },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.xl, backgroundColor: Colors.bgSecondary, borderBottomWidth: 1, borderBottomColor: Colors.borderCard },
    headerTitle: { ...Typography.h2, color: Colors.textPrimary },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.borderCard },
    content: { flex: 1 },
    sectionHeader: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, paddingBottom: Spacing.sm },
    sectionTitle: { ...Typography.small, color: Colors.accentPrimary, textTransform: 'uppercase', letterSpacing: 1 },
    listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, paddingVertical: 14, paddingHorizontal: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.borderCard, marginHorizontal: Spacing.lg, borderRadius: 0 },
    itemIconContainer: { width: 36, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
    itemContent: { flex: 1, justifyContent: 'center' },
    itemTitle: { ...Typography.bodyBold, color: Colors.textPrimary },
    itemDesc: { ...Typography.caption, color: Colors.textMuted, marginTop: 2, paddingRight: Spacing.lg, lineHeight: 18 },
    footer: { padding: 30, alignItems: 'center', marginBottom: 20 },
    footerText: { ...Typography.small, color: Colors.textMuted, marginBottom: 4 },
});
