import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.2.2:3000/api';

export interface CheckIn {
    id: string;
    destination_name: string;
    expected_arrival_at: string;
    status: 'pending' | 'checked_in' | 'missed' | 'cancelled';
    created_at: string;
}

export const createCheckIn = async (destination: string, expectedArrivalAt: string, gracePeriod: number, notifyContacts: string[]) => {
    try {
        const token = await SecureStore.getItemAsync('user_token');
        const response = await axios.post(
            `${API_URL}/check-ins`,
            { destination, expectedArrivalAt, gracePeriod, notifyContacts },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        console.error('Error creating check-in:', error);
        throw error;
    }
};

export const markArrived = async (checkInId: string) => {
    try {
        const token = await SecureStore.getItemAsync('user_token');
        const response = await axios.put(
            `${API_URL}/check-ins/${checkInId}/arrived`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        console.error('Error marking arrived:', error);
        throw error;
    }
};

export const extendCheckIn = async (checkInId: string, additionalMinutes: number) => {
    try {
        const token = await SecureStore.getItemAsync('user_token');
        const response = await axios.put(
            `${API_URL}/check-ins/${checkInId}/extend`,
            { additionalMinutes },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        console.error('Error extending check-in:', error);
        throw error;
    }
};

export const getCheckInHistory = async (): Promise<CheckIn[]> => {
    try {
        const token = await SecureStore.getItemAsync('user_token');
        const response = await axios.get(
            `${API_URL}/check-ins/history`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data.checkIns;
    } catch (error) {
        console.error('Error fetching check-in history:', error);
        throw error;
    }
};

export const cancelCheckIn = async (checkInId: string) => {
    try {
        const token = await SecureStore.getItemAsync('user_token');
        const response = await axios.delete(
            `${API_URL}/check-ins/${checkInId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        console.error('Error cancelling check-in:', error);
        throw error;
    }
};
