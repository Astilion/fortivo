import * as SQLite from 'expo-sqlite';
import { WeightEntry, WeightEntryRow } from '@/types/training';
import { logger } from '@/utils/logger';
import { ServiceError } from '@/utils/errors';
import { generateId } from '@/database/database';
export class WeightService {
  private db: SQLite.SQLiteDatabase;

  constructor(database: SQLite.SQLiteDatabase) {
    this.db = database;
  }

  async addWeightEntry(
    userId: string,
    weight: number,
    date: string,
    notes?: string,
  ): Promise<WeightEntry> {
    const id = generateId('weight-entry');
    const createdAt = new Date().toISOString();
    try {
      await this.db.runAsync(
        `INSERT INTO weight_entries (id, user_id, weight, date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, userId, weight, date, notes || null, createdAt],
      );
    } catch (error) {
      logger.error('WeightService.addWeightEntry failed', error);
      throw new ServiceError('Nie udało się zapisać pomiaru wagi', error);
    }

    logger.db('added weight entry', { userId, weight, date, notes });
    return {
      id,
      userId,
      weight,
      date,
      notes,
      createdAt,
    };
  }

  async getWeightEntries(userId: string): Promise<WeightEntry[]> {
    const rows = await this.db.getAllAsync<WeightEntryRow>(
      `SELECT * FROM weight_entries WHERE user_id = ? ORDER BY date DESC`,
      [userId],
    );

    logger.db('fetched weight entries', [userId, rows]);
    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      weight: row.weight,
      date: row.date,
      notes: row.notes || undefined,
      createdAt: row.created_at,
    }));
  }

  async deleteWeightEntry(id: string): Promise<void> {
    try {
      await this.db.runAsync(`DELETE FROM weight_entries WHERE id = ?`, [id]);
    } catch (error) {
      logger.error('WeightService.deleteWeightEntry failed', error);
      throw new ServiceError('Nie udało się usunąć pomiaru wagi', error);
    }
    logger.db('deleted weight entry', { id });
  }
}
