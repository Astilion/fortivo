import * as SQLite from 'expo-sqlite';
import { BodyMeasurement, BodyMeasurementRow } from '@/types/training';
import { logger } from '@/utils/logger';
import { generateId } from '@/database/database';

export class MeasurementService {
  private db: SQLite.SQLiteDatabase;

  constructor(database: SQLite.SQLiteDatabase) {
    this.db = database;
  }

  async addMeasurement(
    userId: string,
    bodyPart: string,
    value: number,
    date: string,
    notes?: string,
  ): Promise<BodyMeasurement> {
    const id = generateId('measurement-entry');
    const createdAt = new Date().toISOString();
    await this.db.runAsync(
      'INSERT INTO body_measurements (id, user_id, body_part, value, date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, userId, bodyPart, value, date, notes || null, createdAt],
    );

    logger.db('added body measurement', {
      userId,
      bodyPart,
      value,
      date,
      notes,
    });
    return {
      id,
      userId,
      bodyPart,
      value,
      date,
      notes: notes || undefined,
      createdAt,
    };
  }

  async getMeasurements(userId: string): Promise<BodyMeasurement[]> {
    const rows = await this.db.getAllAsync<BodyMeasurementRow>(
      'SELECT * FROM body_measurements WHERE user_id = ? ORDER BY date DESC',
      [userId],
    );
    logger.db('fetched body measurements', [userId, rows]);
    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      bodyPart: row.body_part,
      value: row.value,
      date: row.date,
      notes: row.notes || undefined,
      createdAt: row.created_at,
    }));
  }

  async deleteMeasurement(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM body_measurements WHERE id = ?', [id]);
    logger.db('deleted body measurement', { id });
  }
}
