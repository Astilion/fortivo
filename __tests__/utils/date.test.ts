import { describe, test, expect, afterEach, jest } from '@jest/globals';
import { getGreeting, localDateString } from '@/utils/date';
describe('getGreeting', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns "Dzień dobry" before 18:00', () => {
    jest
      .spyOn(global, 'Date')
      .mockImplementation(() => ({ getHours: () => 10 }) as any);
    expect(getGreeting()).toBe('Dzień dobry');
  });
  test('returns "Dobry wieczór" after 18:00', () => {
    jest
      .spyOn(global, 'Date')
      .mockImplementation(() => ({ getHours: () => 19 }) as any);
    expect(getGreeting()).toBe('Dobry wieczór');
  });
});

describe('localDateString', () => {
  test('returns today in local time for an after-midnight moment', () => {
    // 12 June, 00:30 local. With the old toISOString() this would have
    // rolled back to 2026-06-11 in Poland (UTC+2). Built from components,
    // so the test is deterministic regardless of the runner's timezone.
    expect(localDateString(new Date(2026, 5, 12, 0, 30))).toBe('2026-06-12');
  });

  test('zero-pads single-digit month and day', () => {
    expect(localDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
