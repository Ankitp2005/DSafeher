import { sosService } from '../services/sosService';
import { locationService } from '../services/locationService';
import { evidenceService } from '../services/evidenceService';
import * as SecureStore from 'expo-secure-store';
import { Accelerometer } from 'expo-sensors';

// Mock dependencies
jest.mock('expo-secure-store');
jest.mock('expo-sensors', () => ({
    Accelerometer: {
        setUpdateInterval: jest.fn(),
        addListener: jest.fn(),
        removeAllListeners: jest.fn()
    }
}));
jest.mock('../services/locationService', () => ({
    locationService: {
        startSOSTracking: jest.fn(),
        stopSOSTracking: jest.fn()
    }
}));
jest.mock('../services/evidenceService', () => ({
    evidenceService: {
        startAudioRecording: jest.fn(),
        stopAllRecording: jest.fn()
    }
}));

// Mock fetch
global.fetch = jest.fn() as jest.Mock;

describe('SOS Service Critical Path', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('mock_token');
    });

    it('triggerSOS - should call backend and start services', async () => {
        // Arrange
        const mockResponse = { alert_id: 'test-alert-123' };
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        // Act
        const result = await sosService.triggerSOS('button');

        // Assert
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/sos/trigger'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ trigger_type: 'button' })
            })
        );
        expect(locationService.startSOSTracking).toHaveBeenCalledWith('test-alert-123');
        expect(evidenceService.startAudioRecording).toHaveBeenCalledWith('test-alert-123');
        expect(result).toEqual(mockResponse);
    });

    it('resolveSOS - should resolve backend and stop services', async () => {
        // Arrange
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true })
        });

        // Act
        await sosService.resolveSOS('test-alert-123');

        // Assert
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/sos/test-alert-123/resolve'),
            expect.objectContaining({ method: 'PUT' })
        );
        expect(locationService.stopSOSTracking).toHaveBeenCalled();
        expect(evidenceService.stopAllRecording).toHaveBeenCalledWith('test-alert-123');
    });

    it('initializeTriggers - registers shake listener correctly', () => {
        // Arrange
        const mockCallback = jest.fn();

        // Act
        const cleanup = sosService.initializeTriggers(mockCallback);

        // Assert
        expect(Accelerometer.setUpdateInterval).toHaveBeenCalledWith(100);
        expect(Accelerometer.addListener).toHaveBeenCalled();

        // Simulating cleanup
        cleanup();
    });
});
