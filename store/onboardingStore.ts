import {
  hasCompletedOnboarding,
  setOnboardingCompleted,
} from '@/utils/onboarding';
import { create } from 'zustand';

interface OnboardingStore {
  showOnboarding: boolean | null;
  loadStatus: () => Promise<void>;
  complete: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  showOnboarding: null,
  loadStatus: async () => {
    const completed = await hasCompletedOnboarding();
    set({ showOnboarding: !completed });
  },
  complete: async () => {
    // Flip first so the <Redirect> unmounts synchronously and the flow
    // cannot loop even if the AsyncStorage write is slow or fails.
    set({ showOnboarding: false });
    await setOnboardingCompleted();
  },
}));
