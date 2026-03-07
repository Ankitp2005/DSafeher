import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.2.2:3001/api';

export interface RouteSuggestion {
    id: string;
    summary: string;
    distance: string;
    duration: string;
    polyline: string;
    safety_score: number;
    safety_label: 'Safe' | 'Caution' | 'Avoid';
    incident_count_nearby: number;
    safe_places_nearby: number;
    warnings: string[];
}

export const getRouteSuggestions = async (
    originLat: number, originLng: number,
    destinationLat: number, destinationLng: number
): Promise<RouteSuggestion[]> => {
    try {
        const token = await SecureStore.getItemAsync('user_token');
        const response = await axios.post(
            `${API_URL}/routes/suggest`,
            { origin_lat: originLat, origin_lng: originLng, destination_lat: destinationLat, destination_lng: destinationLng },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data.routes;
    } catch (error) {
        console.error('Error fetching route suggestions:', error);
        throw error;
    }
};

export const startJourney = async (destinationName: string, expectedArrivalAt: string): Promise<string> => {
    try {
        const token = await SecureStore.getItemAsync('user_token');
        const response = await axios.post(
            `${API_URL}/routes/journey/start`,
            { destination_name: destinationName, expected_arrival_at: expectedArrivalAt },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data.journey_id;
    } catch (error) {
        console.error('Error starting journey:', error);
        throw error;
    }
};

export const endJourney = async (journeyId: string): Promise<void> => {
    try {
        const token = await SecureStore.getItemAsync('user_token');
        await axios.post(
            `${API_URL}/routes/journey/end`,
            { journey_id: journeyId },
            { headers: { Authorization: `Bearer ${token}` } }
        );
    } catch (error) {
        console.error('Error ending journey:', error);
        throw error;
    }
};
