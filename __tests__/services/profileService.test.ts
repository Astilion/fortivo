import { ProfileService } from '@/services/profileService';
import { UserSettings } from '@/types/training';

const mockDb = {
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
} as any;

const service = new ProfileService(mockDb);
describe('ProfileService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  test('getUserSettings returns default settings if no row found', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce(null);
    const result = await service.getUserSettings('local_user');
    expect(result.preferredWeightUnit).toBe('kg');
  });
  test('getUserSettings returns settings from database', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({
      user_id: 'user123',
      preferred_weight_unit: 'kg',
      default_rest_time: 120,
      track_rpe: 1,
      track_tempo: 0,
      track_rest_time: 1,
      week_starts_on: 1,
    });
    const result = await service.getUserSettings('local_user');
    expect(result.preferredWeightUnit).toBe('kg');
    expect(result.trackTempo).toBe(false);
    expect(result.trackRPE).toBe(true);
  });
});

describe('updateUserSettings', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  test('updateUserSettings calls dbrunAsync with correct parameters', async () => {
    const settings: UserSettings = {
      userId: 'user123',
      preferredWeightUnit: 'kg',
      defaultRestTime: 120,
      trackRPE: true,
      trackTempo: false,
      trackRestTime: true,
      weekStartsOn: 1,
    };
    await service.updateUserSettings(settings);
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE'),
      expect.arrayContaining([1, 0]),
    );
  });
});
