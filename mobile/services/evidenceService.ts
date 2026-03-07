import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.2.2:3001/api';

export const evidenceService = {
    recording: null as Audio.Recording | null,
    isRecording: false,

    startAudioRecording: async (alertId: string) => {
        try {
            if (evidenceService.isRecording) return;

            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            evidenceService.recording = recording;
            evidenceService.isRecording = true;
            console.log('Started recording evidence for alert', alertId);

            // In a real app, we would chunk this every 30s and upload.
            // For now, we'll just record until stopped.
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    },

    stopAudioRecording: async (alertId: string) => {
        try {
            if (!evidenceService.recording || !evidenceService.isRecording) return;

            await evidenceService.recording.stopAndUnloadAsync();
            const uri = evidenceService.recording.getURI();

            evidenceService.recording = null;
            evidenceService.isRecording = false;

            if (uri) {
                await evidenceService.uploadAudioEvidence(alertId, uri);
            }
        } catch (err) {
            console.error('Failed to stop recording', err);
        }
    },

    uploadAudioEvidence: async (alertId: string, fileUri: string) => {
        try {
            const token = await SecureStore.getItemAsync('user_token');
            const fileInfo = await FileSystem.getInfoAsync(fileUri);

            if (!fileInfo.exists) return;

            const formData = new FormData();
            formData.append('audio', {
                uri: fileUri,
                name: `evidence_${alertId}_${Date.now()}.m4a`,
                type: 'audio/m4a',
            } as any);

            await axios.post(
                `${API_URL}/evidence/audio/${alertId}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );
            console.log('Evidence uploaded successfully');
        } catch (err) {
            console.error('Failed to upload evidence', err);
        }
    },

    stopAllRecording: async (alertId: string) => {
        await evidenceService.stopAudioRecording(alertId);
        // Add photo stopping logic here if needed
    }
};
