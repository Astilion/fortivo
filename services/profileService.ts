import { UserSettings, UserSettingsRow } from '@/types/training';
import * as SQLite from 'expo-sqlite';
import { logger } from '@/utils/logger';

export class ProfileService {
  private db: SQLite.SQLiteDatabase;

  constructor(database: SQLite.SQLiteDatabase) {
    this.db = database;
  }

  async getUserSettings(userId: string): Promise<UserSettings> {
    const row = await this.db.getFirstAsync<UserSettingsRow>(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [userId],
    );

    if (!row) {
      logger.db('no settings found, returning defaults', { userId });
      return {
        userId,
        preferredWeightUnit: 'kg',
        defaultRestTime: 90,
        trackRPE: true,
        trackTempo: false,
        trackRestTime: true,
        weekStartsOn: 1,
      };
    }

    logger.db('fetched user settings', { userId, settings: row });
    return {
      userId: row.user_id,
      preferredWeightUnit: row.preferred_weight_unit as 'kg' | 'lbs',
      defaultRestTime: row.default_rest_time,
      trackRPE: row.track_rpe === 1,
      trackTempo: row.track_tempo === 1,
      trackRestTime: row.track_rest_time === 1,
      weekStartsOn: row.week_starts_on,
      goalWeight: row.goal_weight ?? undefined,
    };
  }

  async updateUserSettings(settings: UserSettings): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO user_settings (user_id, preferred_weight_unit, default_rest_time, track_rpe, track_tempo, track_rest_time, week_starts_on, goal_weight)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        settings.userId,
        settings.preferredWeightUnit,
        settings.defaultRestTime,
        settings.trackRPE ? 1 : 0,
        settings.trackTempo ? 1 : 0,
        settings.trackRestTime ? 1 : 0,
        settings.weekStartsOn,
        settings.goalWeight ?? null,
      ],
    );
    logger.db('updated user settings', { userId: settings.userId, settings });
  }
}
