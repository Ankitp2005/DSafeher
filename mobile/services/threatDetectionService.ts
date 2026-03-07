import { Accelerometer } from 'expo-sensors';
import * as Notifications from 'expo-notifications';
import { sosService } from './sosService';

interface ThreatConfig {
    fallThreshold: number; // G-force threshold for fall detection
    stillnessWindow: number; // ms to monitor for stillness after impact
    checkInInterval: number; // ms for pattern analysis
}

class ThreatDetectionService {
    private subscription: any = null;
    private config: ThreatConfig = {
        fallThreshold: 2.5, // Approx 2.5G
        stillnessWindow: 5000,
        checkInInterval: 30000
    };

    private lastData: { x: number, y: number, z: number } | null = null;
    private isMonitoring = false;

    /**
     * Starts background monitoring of movement patterns
     */
    async startMonitoring() {
        if (this.isMonitoring) return;

        try {
            const isAvailable = await Accelerometer.isAvailableAsync();
            if (!isAvailable) {
                console.log('Accelerometer not available on this device. Threat detection disabled.');
                return;
            }

            this.isMonitoring = true;
            Accelerometer.setUpdateInterval(100); // 10Hz
            this.subscription = Accelerometer.addListener(data => {
                this.analyzeMotion(data);
                this.lastData = data;
            });

            console.log('Threat Detection Service started.');
        } catch (error) {
            console.warn('Failed to start threat detection:', error);
            this.isMonitoring = false;
        }
    }

    stopMonitoring() {
        if (this.subscription) {
            this.subscription.remove();
            this.subscription = null;
        }
        this.isMonitoring = false;
        console.log('Threat Detection Service stopped.');
    }

    private analyzeMotion(data: { x: number, y: number, z: number }) {
        // 1. Fall Detection Logic
        // Acceleration = sqrt(x^2 + y^2 + z^2)
        const gForce = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);

        if (gForce > this.config.fallThreshold) {
            console.log('Potential fall detected! G-Force:', gForce.toFixed(2));
            this.handlePotentialIncident('fall');
        }

        // 2. Sudden Stop Logic (Speed tracking would be in locationService, 
        // but we can detect high impact followed by stillness here)
    }

    private async handlePotentialIncident(type: 'fall' | 'deviation') {
        const message = type === 'fall'
            ? "We detected a sudden impact. Are you okay?"
            : "You appear to have stopped unexpectedly. Are you safe?";

        try {
            // Trigger a local notification with high priority
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Safety Check",
                    body: message,
                    priority: Notifications.AndroidNotificationPriority.MAX,
                    data: { type: 'safety_check', incident: type },
                },
                trigger: null, // immediate
            });
        } catch (error) {
            console.warn('Failed to schedule safety check notification:', error);
        }

        console.log(`Safety check triggered for ${type}. Waiting for user response...`);
    }

    /**
     * Call this when the user responds to the safety check
     */
    async respondToCheck(isSafe: boolean) {
        if (isSafe) {
            console.log('User confirmed safety. Incident cleared.');
        } else {
            console.log('User requested help. Triggering SOS.');
            await sosService.triggerSOS('threat_detection');
        }
    }
}

export const threatDetectionService = new ThreatDetectionService();
