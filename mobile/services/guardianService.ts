import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.2.2:3000/api';

export interface Guardian {
    id: string;
    userId: string;
    contactId: string;
    relationship: string;
    status: 'pending' | 'accepted' | 'rejected';
}

class GuardianService {
    /**
     * Sends an invitation to a contact to be a guardian
     */
    async inviteGuardian(contactId: string, relationship: string) {
        const token = await SecureStore.getItemAsync('userToken');
        const response = await axios.post(`${API_URL}/guardian/invite`, {
            contactId,
            relationship
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }

    /**
     * Fetches users that the current user is guarding
     */
    async getMonitoredUsers() {
        const token = await SecureStore.getItemAsync('userToken');
        const response = await axios.get(`${API_URL}/guardian/monitored`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }

    /**
     * Gets real-time safety status of a monitored user
     */
    async getUserStatus(monitoredUserId: string) {
        const token = await SecureStore.getItemAsync('userToken');
        const response = await axios.get(`${API_URL}/guardian/status/${monitoredUserId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
}

export const guardianService = new GuardianService();
