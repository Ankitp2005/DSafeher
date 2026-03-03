import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Contacts from 'expo-contacts';
import { useOnboardingStore } from '../../../store/onboardingStore';
import { Ionicons } from '@expo/vector-icons';

export default function Step2_Contacts() {
    const router = useRouter();
    const { contacts, addContact, removeContact } = useOnboardingStore();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const validateAndAdd = (newName: string, newPhone: string) => {
        const sanitizedPhone = newPhone.replace(/\s/g, '');

        if (contacts.find(c => c.phoneNumber.replace(/\s/g, '') === sanitizedPhone)) {
            Alert.alert("Duplicate Contact", "This phone number is already in your emergency contacts list.");
            return;
        }

        addContact({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            name: newName.trim(),
            phoneNumber: sanitizedPhone,
            relationship: 'Family',
            notifyOnSOS: true,
            notifyOnCheckInMissed: true
        });
    };

    const handleAdd = () => {
        if (name.trim() && phone.trim()) {
            validateAndAdd(name, phone);
            setName('');
            setPhone('');
        } else {
            Alert.alert("Error", "Please enter both a name and a phone number.");
        }
    };

    const handleImport = async () => {
        try {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
                const contact = await Contacts.presentContactPickerAsync();
                if (contact) {
                    const phoneNumber = contact.phoneNumbers?.[0]?.number;
                    if (phoneNumber) {
                        validateAndAdd(contact.name, phoneNumber);
                    } else {
                        Alert.alert("No Phone Number", "This contact doesn't have a phone number.");
                    }
                }
            } else {
                Alert.alert("Permission Denied", "We need access to your contacts to let you pick an emergency contact.");
            }
        } catch (err) {
            console.error('Contact import error:', err);
            Alert.alert("Error", "Failed to import contact.");
        }
    };

    const handleNext = () => {
        if (contacts.length === 0) {
            Alert.alert("Wait", "Please add at least 1 emergency contact.");
            return;
        }
        router.push('/onboarding/Step3_Addresses');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Emergency Contacts</Text>
            <Text style={styles.subtext}>Who should we alert if you trigger an SOS? Add at least one.</Text>

            <View style={styles.addForm}>
                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    value={phone}
                    keyboardType="phone-pad"
                    onChangeText={setPhone}
                />
                <View style={styles.formButtons}>
                    <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                        <Text style={styles.addButtonText}>Add Manually</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.addButton, styles.importButton]} onPress={handleImport}>
                        <Ionicons name="people-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.addButtonText}>Import</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={contacts}
                keyExtractor={item => item.id}
                style={styles.list}
                renderItem={({ item }) => (
                    <View style={styles.contactCard}>
                        <View>
                            <Text style={styles.contactName}>{item.name}</Text>
                            <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeContact(item.id)}>
                            <Ionicons name="trash-outline" size={24} color="#e53e3e" />
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="alert-circle-outline" size={48} color="#cbd5e0" />
                        <Text style={styles.emptyStateText}>No emergency contacts added yet.</Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={[styles.button, contacts.length === 0 && styles.buttonDisabled]}
                onPress={handleNext}
            >
                <Text style={styles.buttonText}>Next Step</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, backgroundColor: '#fff', paddingTop: 60 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
    subtext: { fontSize: 14, color: '#666', marginBottom: 24 },
    addForm: { marginBottom: 24, padding: 16, backgroundColor: '#f7fafc', borderRadius: 12 },
    input: { borderBottomWidth: 1, borderBottomColor: '#cbd5e0', paddingVertical: 8, marginBottom: 16, fontSize: 16 },
    formButtons: { flexDirection: 'row', gap: 12 },
    addButton: { flex: 1, backgroundColor: '#3182ce', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    importButton: { backgroundColor: '#4a5568' },
    addButtonText: { color: '#fff', fontWeight: 'bold' },
    list: { flex: 1 },
    contactCard: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#edf2f7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2
    },
    contactName: { fontSize: 18, fontWeight: 'bold', color: '#2d3748' },
    contactPhone: { fontSize: 14, color: '#718096', marginTop: 2 },
    emptyState: { alignItems: 'center', marginTop: 40 },
    emptyStateText: { marginTop: 12, color: '#a0aec0', fontSize: 16 },
    button: { backgroundColor: '#e53e3e', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16, marginBottom: 20 },
    buttonDisabled: { backgroundColor: '#fc8181' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
