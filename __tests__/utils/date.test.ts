import { getGreeting } from '@/utils/date';

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
