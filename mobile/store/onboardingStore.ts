import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

interface EmergencyContact {
    id: string;
    name: string;
    phoneNumber: string;
    relationship: string;
    notifyOnSOS: boolean;
    notifyOnCheckInMissed: boolean;
}

interface OnboardingState {
    permissions: {
        location: boolean;
        contacts: boolean;
        notifications: boolean;
        microphone: boolean;
    };
    contacts: EmergencyContact[];
    addresses: {
        home: string;
        work: string;
    };
    sosPreferences: {
        powerButton: boolean;
        shakeGesture: boolean;
        countdownSeconds: number;
        autoRecordAudio: boolean;
    };
    fakeCallSetup: {
        callerName: string;
    };

    setPermission: (key: keyof OnboardingState['permissions'], val: boolean) => void;
    addContact: (contact: EmergencyContact) => void;
    setAddress: (type: 'home' | 'work', val: string) => void;
    setSosPreference: (key: keyof OnboardingState['sosPreferences'], val: any) => void;
    setFakeCallSetup: (val: string) => void;
    removeContact: (id: string) => void;
}

const secureStorageWrapper = {
    getItem: (name: string) => SecureStore.getItemAsync(name),
    setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
    removeItem: (name: string) => SecureStore.deleteItemAsync(name),
};

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            permissions: {
                location: false,
                contacts: false,
                notifications: false,
                microphone: false
            },
            contacts: [],
            addresses: {
                home: '',
                work: ''
            },
            sosPreferences: {
                powerButton: true,
                shakeGesture: true,
                countdownSeconds: 5,
                autoRecordAudio: true
            },
            fakeCallSetup: {
                callerName: 'Mom'
            },

            setPermission: (key, val) => set((state) => ({
                permissions: { ...state.permissions, [key]: val }
            })),
            addContact: (contact) => set((state) => ({
                contacts: [...state.contacts, contact]
            })),
            setAddress: (type, val) => set((state) => ({
                addresses: { ...state.addresses, [type]: val }
            })),
            setSosPreference: (key, val) => set((state) => ({
                sosPreferences: { ...state.sosPreferences, [key]: val }
            })),
            setFakeCallSetup: (val) => set((state) => ({
                fakeCallSetup: { callerName: val }
            })),
            removeContact: (id) => set((state) => ({
                contacts: state.contacts.filter(c => c.id !== id)
            }))
        }),
        {
            name: 'onboarding-storage',
            storage: createJSONStorage(() => secureStorageWrapper),
        }
    )
);
