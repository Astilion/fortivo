import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

export const CRASH_REPORTING_KEY = 'crashReportingEnabled';

export const isCrashReportingEnabled = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(CRASH_REPORTING_KEY);
    return value !== 'false';
  } catch (error) {
    // Opt-out model: an unreadable flag must not silently kill reporting.
    logger.error('Failed to read crash reporting flag', error);
    return true;
  }
};

export const setCrashReportingEnabled = async (
  enabled: boolean,
): Promise<void> => {
  // Write failures propagate so the screen can roll back the toggle it already
  // flipped optimistically.
  await AsyncStorage.setItem(CRASH_REPORTING_KEY, enabled ? 'true' : 'false');
};
