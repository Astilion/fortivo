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
}
