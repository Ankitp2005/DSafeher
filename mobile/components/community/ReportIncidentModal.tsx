import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { submitReport } from '../../services/reportService';

interface ReportIncidentModalProps {
    visible: boolean;
    onClose: () => void;
    currentLocation: { latitude: number, longitude: number } | null;
    onSuccess: () => void;
}

const INCIDENT_TYPES = [
    { key: 'harassment', label: 'Harassment', icon: 'hand-left', color: '#DD6B20' },
    { key: 'poor_lighting', label: 'Poor Lighting', icon: 'bulb', color: '#D69E2E' },
    { key: 'suspicious_activity', label: 'Suspicious Activity', icon: 'eye', color: '#D69E2E' },
    { key: 'unsafe_area', label: 'Unsafe Area', icon: 'warning', color: '#1A202C' },
    { key: 'assault', label: 'Assault', icon: 'skull', color: '#E53E3E' },
    { key: 'following', label: 'Being Followed', icon: 'walk', color: '#DD6B20' },
    { key: 'other', label: 'Other', icon: 'help-circle', color: '#718096' }
];

export default function ReportIncidentModal({ visible, onClose, currentLocation, onSuccess }: ReportIncidentModalProps) {
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!selectedType || !currentLocation) return;
        setLoading(true);
        try {
            await submitReport({
                incident_type: selectedType,
                description,
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                is_anonymous: isAnonymous
            });
            Alert.alert('Report Submitted', 'Thank you for keeping the community safe.');
            onClose();
            onSuccess();
        } catch (error) {
            Alert.alert('Error', 'Failed to submit report. Ensure you are connected.');
        } finally {
            setLoading(false);
            setStep(1);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.subtitle}>What happened?</Text>
                        <View style={styles.grid}>
                            {INCIDENT_TYPES.map(type => (
                                <TouchableOpacity
                                    key={type.key}
                                    style={[styles.typeCard, selectedType === type.key && { borderColor: type.color, backgroundColor: `${type.color}10` }]}
                                    onPress={() => setSelectedType(type.key)}
                                >
                                    <Ionicons name={type.icon as any} size={28} color={type.color} />
                                    <Text style={styles.typeLabel}>{type.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );
            case 2:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.subtitle}>Any additional details?</Text>
                        <TextInput
                            style={styles.textArea}
                            multiline
                            numberOfLines={4}
                            placeholder="Describe what happened (optional)..."
                            value={description}
                            onChangeText={setDescription}
                        />
                        <View style={styles.anonToggle}>
                            <Text style={styles.anonText}>Report Anonymously</Text>
                            <TouchableOpacity style={styles.toggleBtn} onPress={() => setIsAnonymous(!isAnonymous)}>
                                <Ionicons name={isAnonymous ? "checkmark-circle" : "ellipse-outline"} size={24} color={isAnonymous ? "#48BB78" : "#A0AEC0"} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.hintText}>Your identity will not be shared if anonymous.</Text>
                    </View>
                );
            default: return null;
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Report Incident</Text>
                        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#718096" /></TouchableOpacity>
                    </View>

                    <ScrollView>
                        {renderStepContent()}
                    </ScrollView>

                    <View style={styles.footer}>
                        {step > 1 && (
                            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
                                <Text style={styles.backBtnText}>Back</Text>
                            </TouchableOpacity>
                        )}
                        {step < 2 ? (
                            <TouchableOpacity style={[styles.nextBtn, !selectedType && styles.nextBtnDisabled]} onPress={() => setStep(step + 1)} disabled={!selectedType}>
                                <Text style={styles.nextBtnText}>Next Step</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={[styles.submitBtn, loading && styles.nextBtnDisabled]} onPress={handleSubmit} disabled={loading}>
                                <Text style={styles.submitBtnText}>{loading ? "Submitting..." : "Submit Report"}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: '#4A5568',
    },
    stepContainer: {
        paddingBottom: 20,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    typeCard: {
        width: '48%',
        backgroundColor: '#F7FAFC',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeLabel: {
        marginTop: 8,
        fontWeight: '600',
        color: '#2D3748',
        textAlign: 'center',
    },
    textArea: {
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        height: 120,
        textAlignVertical: 'top',
        fontSize: 16,
        marginBottom: 16,
    },
    anonToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
    },
    anonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2D3748',
    },
    toggleBtn: {
        padding: 4,
    },
    hintText: {
        fontSize: 13,
        color: '#718096',
        marginTop: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 16,
    },
    backBtn: {
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flex: 1,
        alignItems: 'center',
        marginRight: 8,
    },
    backBtnText: {
        fontWeight: '600',
        color: '#4A5568',
        fontSize: 16,
    },
    nextBtn: {
        padding: 14,
        borderRadius: 8,
        backgroundColor: '#E53E3E',
        flex: 1,
        alignItems: 'center',
        marginLeft: 8,
    },
    submitBtn: {
        padding: 14,
        borderRadius: 8,
        backgroundColor: '#48BB78',
        flex: 2,
        alignItems: 'center',
        marginLeft: 8,
    },
    nextBtnDisabled: {
        opacity: 0.5,
    },
    nextBtnText: {
        fontWeight: '600',
        color: 'white',
        fontSize: 16,
    },
    submitBtnText: {
        fontWeight: 'bold',
        color: 'white',
        fontSize: 16,
    }
});
