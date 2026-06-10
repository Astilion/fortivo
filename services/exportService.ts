import * as SQLite from 'expo-sqlite';
import Constants from 'expo-constants';
import { ServiceError } from '@/utils/errors';
import { logger } from '@/utils/logger';

// Seeded exercises are reproducible from assets/data/exercises.json, so only
// custom ones are exported (handled separately with an is_custom filter).
const EXPORT_TABLES = [
  'workouts',
  'workout_exercises',
  'workout_sets',
  'weekly_plans',
  'weekly_plan_days',
  'exercise_progress',
  'workout_history',
  'weight_entries',
  'body_measurements',
  'user_settings',
  'favorite_exercises',
] as const;

export interface ExportEnvelope {
  schemaVersion: number;
  appVersion: string;
  exportedAt: string;
  tables: Record<string, unknown[]>;
}

export class ExportService {
  private db: SQLite.SQLiteDatabase;

  constructor(database: SQLite.SQLiteDatabase) {
    this.db = database;
  }

  async exportAllData(): Promise<ExportEnvelope> {
    try {
      const tables: Record<string, unknown[]> = {};
      for (const table of EXPORT_TABLES) {
        tables[table] = await this.db.getAllAsync(`SELECT * FROM ${table}`);
      }
      tables.exercises = await this.db.getAllAsync(
        `SELECT * FROM exercises WHERE is_custom = 1`,
      );

      const version = await this.db.getFirstAsync<{ user_version: number }>(
        'PRAGMA user_version',
      );

      logger.db('exported all data', {
        rowCounts: Object.fromEntries(
          Object.entries(tables).map(([name, rows]) => [name, rows.length]),
        ),
      });

      return {
        schemaVersion: version?.user_version ?? 0,
        appVersion: Constants.expoConfig?.version ?? 'unknown',
        exportedAt: new Date().toISOString(),
        tables,
      };
    } catch (error) {
      logger.error('ExportService.exportAllData failed', error);
      throw new ServiceError('Nie udało się wyeksportować danych', error);
    }
  }
}
