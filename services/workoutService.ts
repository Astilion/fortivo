import * as SQLite from 'expo-sqlite';
import { generateId } from '@/database/database';
import {
  Workout,
  WorkoutRow,
  WorkoutExercise,
  WorkoutExerciseRow,
  Exercise,
  ExerciseRow,
  WorkoutSet,
  WorkoutSetRow,
} from '@/types/training';


interface WorkoutExerciseWithSets {
  exercise: Exercise;
  sets: WorkoutSet[];
  isExpanded?: boolean;
}

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
        workout.date.toISOString(),
        workout.duration || null,
        workout.notes || null,
        workout.tags ? JSON.stringify(workout.tags) : null,
        workout.completed ? 1 : 0,
        workout.templateId || null,
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


  async saveWorkoutExercises(
    workoutId: string,
    exercises: WorkoutExerciseWithSets[],
  ): Promise<void> {
    await this.db.runAsync(
      'DELETE FROM workout_exercises WHERE workout_id = ?',
      [workoutId],
    );

    for (let i = 0; i < exercises.length; i++) {
      const { exercise, sets } = exercises[i];
      const workoutExerciseId = generateId('we');

      await this.db.runAsync(
        `INSERT INTO workout_exercises (
          id, workout_id, exercise_id, exercise_order, superset_group, notes
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [workoutExerciseId, workoutId, exercise.id, i, null, null],
      );

      for (let j = 0; j < sets.length; j++) {
        const set = sets[j];
        const setId = generateId('ws'); // workout_set

        await this.db.runAsync(
          `INSERT INTO workout_sets (
            id, workout_exercise_id, set_order, reps, weight, rpe, 
            tempo, rest_time, completed, notes, actual_reps, actual_weight, actual_rpe
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            setId,
            workoutExerciseId,
            j, // set_order
            set.reps,
            set.weight || null,
            set.rpe || null,
            set.tempo || null,
            set.restTime || null,
            set.completed ? 1 : 0,
            set.notes || null,
            set.actualReps || null,
            set.actualWeight || null,
            set.actualRpe || null,
          ],
        );
      }
    }
  }

  async getWorkoutExercises(
    workoutId: string,
  ): Promise<WorkoutExerciseWithSets[]> {

    const workoutExercises = await this.db.getAllAsync<WorkoutExerciseRow>(
      `SELECT * FROM workout_exercises 
       WHERE workout_id = ? 
       ORDER BY exercise_order ASC`,
      [workoutId],
    );

    const result: WorkoutExerciseWithSets[] = [];

    for (const we of workoutExercises) {
      const exerciseRow = await this.db.getFirstAsync<ExerciseRow>(
        'SELECT * FROM exercises WHERE id = ?',
        [we.exercise_id],
      );

      if (!exerciseRow) continue;

      const setRows = await this.db.getAllAsync<WorkoutSetRow>(
        `SELECT * FROM workout_sets 
         WHERE workout_exercise_id = ? 
         ORDER BY set_order ASC`,
        [we.id],
      );

      const exercise: Exercise = {
        id: exerciseRow.id,
        name: exerciseRow.name,
        category: exerciseRow.category,
        muscleGroups: JSON.parse(exerciseRow.muscle_groups),
        equipment: exerciseRow.equipment
          ? JSON.parse(exerciseRow.equipment)
          : undefined,
        difficulty: exerciseRow.difficulty as
          | 'Początkujący'
          | 'Średniozaawansowany'
          | 'Zaawansowany'
          | undefined,
        isCustom: exerciseRow.is_custom === 1,
        userId: exerciseRow.user_id || undefined,
        photo: exerciseRow.photo || undefined,
        video: exerciseRow.video || undefined,
        createdAt: new Date(exerciseRow.created_at),
      };

      const sets: WorkoutSet[] = setRows.map((setRow) => ({
        id: setRow.id,
        reps: setRow.reps,
        weight: setRow.weight || undefined,
        rpe: setRow.rpe || undefined,
        tempo: setRow.tempo || undefined,
        restTime: setRow.rest_time || undefined,
        completed: setRow.completed === 1,
        notes: setRow.notes || undefined,
        actualReps: setRow.actual_reps || undefined,
        actualWeight: setRow.actual_weight || undefined,
        actualRpe: setRow.actual_rpe || undefined,
      }));

      result.push({
        exercise,
        sets,
        isExpanded: false,
      });
    }

    return result;
  }
}
