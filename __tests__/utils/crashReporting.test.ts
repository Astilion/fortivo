import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CRASH_REPORTING_CONSENT_META_KEY,
  CRASH_REPORTING_KEY,
  isCrashReportingEnabled,
  setCrashReportingEnabled,
} from '@/utils/crashReporting';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

const mockedStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('isCrashReportingEnabled', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns false when the flag was never set', async () => {
    mockedStorage.getItem.mockResolvedValue(null);
    await expect(isCrashReportingEnabled()).resolves.toBe(false);
  });

  test('returns true only for an explicit opt-in', async () => {
    mockedStorage.getItem.mockResolvedValue('true');
    await expect(isCrashReportingEnabled()).resolves.toBe(true);
  });

  test('returns false when the flag cannot be read', async () => {
    mockedStorage.getItem.mockRejectedValue(new Error('storage unavailable'));
    await expect(isCrashReportingEnabled()).resolves.toBe(false);
  });
});

describe('setCrashReportingEnabled', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('resolves even when the consent metadata write fails', async () => {
    mockedStorage.setItem.mockImplementation(async (key: string) => {
      if (key === CRASH_REPORTING_CONSENT_META_KEY) {
        throw new Error('storage full');
      }
    });

    await expect(
      setCrashReportingEnabled(true, 'onboarding'),
    ).resolves.toBeUndefined();

    expect(mockedStorage.setItem).toHaveBeenCalledWith(
      CRASH_REPORTING_KEY,
      'true',
    );
  });
});
