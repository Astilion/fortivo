import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

export const ONBOARDING_KEY = 'hasCompletedOnboarding';

export const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    // On read failure, treat as not completed so onboarding still shows.
    logger.error('Failed to read onboarding flag', error);
    return false;
  }
};

export const setOnboardingCompleted = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (error) {
    // Swallow write failures so the user is never blocked from entering the app.
    logger.error('Failed to persist onboarding flag', error);
  }
};
