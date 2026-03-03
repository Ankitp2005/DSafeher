import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCheckInHistory, CheckIn } from '../../services/checkInService';

export default function CheckInHistoryScreen() {
    const [history, setHistory] = useState<CheckIn[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getCheckInHistory();
            setHistory(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load check-in history');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: CheckIn['status']) => {
        switch (status) {
            case 'checked_in': return <Ionicons name="checkmark-circle" size={24} color="#10b981" />;
            case 'missed': return <Ionicons name="close-circle" size={24} color="#ef4444" />;
            case 'cancelled': return <Ionicons name="remove-circle" size={24} color="#6b7280" />;
            case 'pending': return <Ionicons name="time" size={24} color="#f59e0b" />;
            default: return <Ionicons name="help-circle" size={24} color="#6b7280" />;
        }
    };

    const renderItem = ({ item }: { item: CheckIn }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.destinationName}>{item.destination_name}</Text>
                {getStatusIcon(item.status)}
            </View>
            <Text style={styles.dateText}>
                {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
            </Text>
            <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Journey History</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#ef4444" />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : history.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="navigate-circle-outline" size={64} color="#d1d5db" />
                    <Text style={styles.emptyText}>No journeys found.</Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    listContainer: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    destinationName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    dateText: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 12,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4b5563',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 16,
        textAlign: 'center',
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 16,
        marginTop: 12,
    },
});
