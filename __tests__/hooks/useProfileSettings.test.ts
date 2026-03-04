import { useProfileSettings } from '@/hooks/useProfileSettings';
import { renderHook, act } from '@testing-library/react-native';

const mockProfileService = {
  getUserSettings: jest.fn().mockResolvedValue({
    userId: 'local_user',
    preferredWeightUnit: 'kg',
    defaultRestTime: 90,
    trackRPE: true,
    trackTempo: false,
    trackRestTime: true,
    weekStartsOn: 1,
  }),
  updateUserSettings: jest.fn(),
};

jest.mock('@/providers/AppProvider', () => ({
  useApp: () => ({
    profileService: mockProfileService,
  }),
}));

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    require('react').useEffect(callback, []);
  },
}));

describe('loadSettings', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  test('loadSettings on mount', async () => {
    const { result } = renderHook(() => useProfileSettings());
    expect(result.current.loading).toBe(true);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(result.current.settings).not.toBeNull();
  });
  test('check preferredWeightUnit and defaultRestTime', async () => {
    const { result } = renderHook(() => useProfileSettings());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(result.current.settings?.preferredWeightUnit).toBe('kg');
    expect(result.current.settings?.defaultRestTime).toBe(90);
  });
  test('check if updateSettings calls profileService.updateUserSettings', async () => {
    const { result } = renderHook(() => useProfileSettings());
    const { profileService } = require('@/providers/AppProvider').useApp();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await act(async () => {
      await result.current.updateSettings();
    });
    expect(mockProfileService.updateUserSettings).toHaveBeenCalledTimes(1);
  });
});
