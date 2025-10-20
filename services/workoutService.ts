import * as SQLite from 'expo-sqlite';
import { generateId } from '@/database/database';
import {
  Workout,
  WorkoutRow,
  WorkoutExercise,
  WorkoutExerciseRow,
} from '@/types/training';

export class WorkoutService {
  private db: SQLite.SQLiteDatabase;

  constructor(database: SQLite.SQLiteDatabase) {
    this.db = database;
  }

  async getAllWorkouts(): Promise<WorkoutRow[]> {
    const query = 'SELECT * FROM workouts ORDER BY created_at DESC';
    const rows = await this.db.getAllAsync<WorkoutRow>(query);
    return rows;
  }

  async createWorkout(
    workout: Omit<Workout, 'id' | 'createdAt' | 'exercises'>,
  ): Promise<Workout> {
    const id = generateId('workout');
    const createdAt = new Date();

    await this.db.runAsync(
      `INSERT INTO workouts (
        id, name, date, duration, notes, tags, completed, template_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        workout.name,
        workout.date.toISOString(), //  Date → string
        workout.duration || null,
        workout.notes || null,
        workout.tags ? JSON.stringify(workout.tags) : null, //  Array → JSON
        workout.completed ? 1 : 0, //  Boolean → 0/1
        workout.templateId || null, //  undefined → null
        createdAt.toISOString(),
      ],
    );

    return {
      id,
      ...workout,
      exercises: [],
      createdAt,
    } as Workout;
  }

  async deleteWorkout(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
  }

  async updateWorkout(
    id: string,
    updates: Partial<Omit<Workout, 'id' | 'createdAt' | 'exercises'>>,
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.date !== undefined) {
      fields.push('date = ?');
      values.push(updates.date.toISOString());
    }
    if (updates.duration !== undefined) {
      fields.push('duration = ?');
      values.push(updates.duration);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(updates.tags ? JSON.stringify(updates.tags) : null);
    }
    if (updates.completed !== undefined) {
      fields.push('completed = ?');
      values.push(updates.completed ? 1 : 0);
    }

    if (fields.length === 0) return;

    values.push(id);

    await this.db.runAsync(
      `UPDATE workouts SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );
  }
  async getWorkoutById(id: string): Promise<WorkoutRow | null> {
    const row = await this.db.getFirstAsync<WorkoutRow>(
      'SELECT * FROM workouts WHERE id = ?',
      [id],
    );
    return row || null;
  }
}
