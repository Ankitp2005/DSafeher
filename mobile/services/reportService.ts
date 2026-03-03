import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.2.2:3000/api';

export interface ReportData {
    incident_type: string;
    description?: string;
    latitude: number;
    longitude: number;
    photo_url?: string;
    is_anonymous: boolean;
}

export const submitReport = async (reportData: ReportData) => {
    try {
        const token = await SecureStore.getItemAsync('user_token');
        const response = await axios.post(`${API_URL}/reports`, reportData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error submitting report:', error);
        throw error;
    }
}

export const getIncidentsMap = async () => {
    try {
        const response = await axios.get(`${API_URL}/reports/map`);
        return response.data.reports || [];
    } catch (error) {
        console.error('Error fetching reports map:', error);
        return [];
    }
}
