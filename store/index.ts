import { create } from 'zustand';
import { mmkvStorage } from './mmkv'; // We'll need to create this wrapper
import { createJSONStorage, persist } from 'zustand/middleware';

// Types
interface CheckInState {
  step: 'face' | 'cough' | 'skin' | 'tremor' | 'processing' | 'results';
  isCapturing: boolean;
  setStep: (step: CheckInState['step']) => void;
  setIsCapturing: (isCapturing: boolean) => void;
  reset: () => void;
}

interface VitalsState {
  heartRate: number | null;
  hrv: number | null;
  breathingRate: number | null;
  tremorIndex: number | null;
  coughType: string | null;
  setVitals: (vitals: Partial<Omit<VitalsState, 'setVitals' | 'reset'>>) => void;
  reset: () => void;
}

interface SettingsState {
  hasCompletedOnboarding: boolean;
  isPrivacyMode: boolean;
  setHasCompletedOnboarding: (val: boolean) => void;
  togglePrivacyMode: () => void;
}

// Stores

export const useCheckInStore = create<CheckInState>((set) => ({
  step: 'face',
  isCapturing: false,
  setStep: (step) => set({ step }),
  setIsCapturing: (isCapturing) => set({ isCapturing }),
  reset: () => set({ step: 'face', isCapturing: false }),
}));

export const useVitalsStore = create<VitalsState>((set) => ({
  heartRate: null,
  hrv: null,
  breathingRate: null,
  tremorIndex: null,
  coughType: null,
  setVitals: (vitals) => set((state) => ({ ...state, ...vitals })),
  reset: () => set({ heartRate: null, hrv: null, breathingRate: null, tremorIndex: null, coughType: null }),
}));

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      isPrivacyMode: true,
      setHasCompletedOnboarding: (val) => set({ hasCompletedOnboarding: val }),
      togglePrivacyMode: () => set((state) => ({ isPrivacyMode: !state.isPrivacyMode })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
