import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRIVACY_POLICY_VERSION } from '@/constants/Links';
import { logger } from '@/utils/logger';

export const CRASH_REPORTING_KEY = 'crashReportingEnabled';
export const CRASH_REPORTING_CONSENT_META_KEY = 'crashReportingConsentMeta';

export type ConsentSource = 'onboarding' | 'profile';

export interface CrashReportingConsentMeta {
  value: boolean;
  at: string;
  policyVersion: string;
  source: ConsentSource;
}

export const isCrashReportingEnabled = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(CRASH_REPORTING_KEY);
    return value === 'true';
  } catch (error) {
    // Opt-in model: an unreadable flag must not silently enable reporting.
    logger.error('Failed to read crash reporting flag', error);
    return false;
  }
};

export const setCrashReportingEnabled = async (
  enabled: boolean,
  source: ConsentSource,
): Promise<void> => {
  // Write failures propagate so the screen can roll back the toggle it already
  // flipped optimistically.
  await AsyncStorage.setItem(CRASH_REPORTING_KEY, enabled ? 'true' : 'false');

  const meta: CrashReportingConsentMeta = {
    value: enabled,
    at: new Date().toISOString(),
    policyVersion: PRIVACY_POLICY_VERSION,
    source,
  };

  // Fire-and-forget: the metadata is an audit trail, not the flag itself. A
  // failed write here must not roll back a consent decision that already stuck.
  AsyncStorage.setItem(
    CRASH_REPORTING_CONSENT_META_KEY,
    JSON.stringify(meta),
  ).catch((error) => {
    logger.error('Failed to record crash reporting consent metadata', error);
  });
};
