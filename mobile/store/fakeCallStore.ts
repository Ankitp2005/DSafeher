import { create } from 'zustand';

export type FakeCallStatus = 'idle' | 'incoming' | 'active';

interface FakeCallState {
    status: FakeCallStatus;
    callerName: string;
    setStatus: (status: FakeCallStatus) => void;
    setCallerName: (name: string) => void;
    endCall: () => void;
}

export const useFakeCallStore = create<FakeCallState>((set) => ({
    status: 'idle',
    callerName: 'Mom',
    setStatus: (status) => set({ status }),
    setCallerName: (callerName) => set({ callerName }),
    endCall: () => set({ status: 'idle' }),
}));
