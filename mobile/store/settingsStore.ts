import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
    isDisguised: boolean;
    disguiseCode: string; // e.g. "57+"
    setDisguised: (val: boolean) => void;
    setDisguiseCode: (code: string) => void;

    // Safety Triggers
    usePowerButton: boolean;
    useShake: boolean;
    setUsePowerButton: (val: boolean) => void;
    setUseShake: (val: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            isDisguised: false,
            disguiseCode: '57+',
            setDisguised: (val) => set({ isDisguised: val }),
            setDisguiseCode: (code) => set({ disguiseCode: code }),

            usePowerButton: true,
            useShake: true,
            setUsePowerButton: (val) => set({ usePowerButton: val }),
            setUseShake: (val) => set({ useShake: val }),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
