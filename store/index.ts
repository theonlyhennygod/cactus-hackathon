import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStorage } from './mmkv'; // We'll need to create this wrapper

// Types
interface CheckInState {
  step: 'face' | 'cough' | 'breathing' | 'tremor' | 'processing' | 'results';
  isCapturing: boolean;
  setStep: (step: CheckInState['step']) => void;
  setIsCapturing: (isCapturing: boolean) => void;
  reset: () => void;
}

interface VitalsState {
  // Core vitals
  heartRate: number | null;
  hrv: number | null;
  breathingRate: number | null;
  tremorIndex: number | null;
  coughType: string | null;
  // Vision analysis
  skinCondition: string | null;
  // AI Triage results
  summary: string | null;
  severity: 'green' | 'yellow' | 'red' | null;
  recommendations: string[] | null;
  inferenceType: 'local' | 'cloud' | 'fallback' | null;
  // Methods
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
  // Core vitals
  heartRate: null,
  hrv: null,
  breathingRate: null,
  tremorIndex: null,
  coughType: null,
  // Vision analysis
  skinCondition: null,
  // AI Triage results
  summary: null,
  severity: null,
  recommendations: null,
  inferenceType: null,
  // Methods
  setVitals: (vitals) => set((state) => ({ ...state, ...vitals })),
  reset: () => set({ 
    heartRate: null, 
    hrv: null, 
    breathingRate: null, 
    tremorIndex: null, 
    coughType: null,
    skinCondition: null,
    summary: null,
    severity: null,
    recommendations: null,
    inferenceType: null,
  }),
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
