import { generateId } from '@/database/database';
import {
  Exercise,
  ExerciseProgressQueryRow,
  ExerciseProgressRow,
  ExerciseProgressWithWorkout,
  ExerciseRow,
  Workout,
  WorkoutExerciseRow,
  WorkoutExerciseWithSets,
  WorkoutHistoryDetails,
  WorkoutHistoryQueryRow,
  WorkoutHistoryRow,
  WorkoutHistoryWithDetails,
  WorkoutRow,
  WorkoutSet,
  WorkoutSetRow,
} from '@/types/training';
import * as SQLite from 'expo-sqlite';

export class WorkoutService {
  private db: SQLite.SQLiteDatabase;

  constructor(database: SQLite.SQLiteDatabase) {
    this.db = database;
  }

  async getAllWorkouts(): Promise<WorkoutRow[]> {
    const query =
      'SELECT * FROM workouts ORDER BY display_order ASC, created_at DESC';
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
    tempo, rest_time, completed, notes, actual_reps, actual_weight, actual_rpe,
    duration, actual_duration, distance, actual_distance
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            setId,
            workoutExerciseId,
            j,
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
            set.duration || null,
            set.actualDuration || null,
            set.distance || null,
            set.actualDistance || null,
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
        categories: JSON.parse(exerciseRow.categories),
        muscleGroups: JSON.parse(exerciseRow.muscle_groups),
        equipment: exerciseRow.equipment
          ? JSON.parse(exerciseRow.equipment)
          : undefined,
        difficulty: exerciseRow.difficulty as
          | 'Początkujący'
          | 'Średniozaawansowany'
          | 'Zaawansowany'
          | undefined,
        measurementType:
          (exerciseRow.measurement_type as 'reps' | 'time' | 'distance') ||
          'reps',
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
        duration: setRow.duration || undefined, // <-- NOWE
        actualDuration: setRow.actual_duration || undefined, // <-- NOWE
        distance: setRow.distance || undefined, // <-- NOWE
        actualDistance: setRow.actual_distance || undefined, // <-- NOWE
      }));

      result.push({
        exercise,
        sets,
        isExpanded: false,
      });
    }

    return result;
  }

  async reorderWorkouts(workoutIds: string[]): Promise<void> {
    for (let i = 0; i < workoutIds.length; i++) {
      await this.db.runAsync(
        'UPDATE workouts SET display_order = ? WHERE id = ?',
        [i, workoutIds[i]],
      );
    }
  }

  async setActiveWorkout(id: string): Promise<void> {
    await this.db.runAsync('UPDATE workouts SET is_active = 0');

    await this.db.runAsync('UPDATE workouts SET is_active = ? WHERE id = ?', [
      1,
      id,
    ]);
  }

  async getActiveWorkout(): Promise<WorkoutRow | null> {
    const row = await this.db.getFirstAsync<WorkoutRow>(
      'SELECT * FROM workouts WHERE is_active = 1 LIMIT 1',
    );
    return row || null;
  }

  async clearActiveWorkout(): Promise<void> {
    await this.db.runAsync('UPDATE workouts SET is_active = ?');
  }

  async saveActualValues(
    workoutId: string,
    exercises: WorkoutExerciseWithSets[],
  ): Promise<void> {
    for (const ex of exercises) {
      for (const set of ex.sets) {
        await this.db.runAsync(
          'UPDATE workout_sets SET actual_reps = ?, actual_weight = ?, completed = ? WHERE id = ?',
          [
            set.actualReps ?? null,
            set.actualWeight ?? null,
            set.completed ? 1 : 0,
            set.id,
          ],
        );
      }
    }
  }

  async saveWorkoutHistory(
    workoutId: string,
    durationMinutes: number,
  ): Promise<void> {
    const id = generateId('wh'); // workout_history
    const completedAt = new Date().toISOString();
    const userId = 'user_1'; // TODO: Replace with real user ID later

    await this.db.runAsync(
      `INSERT INTO workout_history (
      id, workout_id, user_id, completed_at, actual_duration, performance_notes
    ) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, workoutId, userId, completedAt, durationMinutes, null],
    );
  }

  async saveExerciseProgress(
    workoutId: string,
    exercises: WorkoutExerciseWithSets[],
  ): Promise<void> {
    const userId = 'user_1';
    const date = new Date().toISOString();

    for (const ex of exercises) {
      const completedSets = ex.sets.filter((s) => s.completed);

      if (completedSets.length === 0) continue;

      const maxWeight = Math.max(
        ...completedSets.map((s) => s.actualWeight || 0),
      );

      const totalVolume = completedSets.reduce((sum, set) => {
        return sum + (set.actualReps || 0) * (set.actualWeight || 0);
      }, 0);

      const previousRecord = await this.db.getFirstAsync<ExerciseProgressRow>(
        `SELECT * FROM exercise_progress 
       WHERE exercise_id = ? AND user_id = ? 
       ORDER BY max_weight DESC LIMIT 1`,
        [ex.exercise.id, userId],
      );

      const isPersonalRecord =
        !previousRecord || maxWeight > previousRecord.max_weight;
      const id = generateId('ep');

      await this.db.runAsync(
        `INSERT INTO exercise_progress (
        id, exercise_id, user_id, date, max_weight, total_volume, 
        estimated_one_rep_max, personal_record
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          ex.exercise.id,
          userId,
          date,
          maxWeight,
          totalVolume,
          null,
          isPersonalRecord ? 1 : 0,
        ],
      );
    }
  }

  async getWorkoutHistory(
    userId: string = 'user_1',
  ): Promise<WorkoutHistoryWithDetails[]> {
    const rows = await this.db.getAllAsync<WorkoutHistoryQueryRow>(
      `SELECT 
      wh.id,
      wh.workout_id,
      wh.completed_at,
      wh.actual_duration,
      w.name as workout_name
    FROM workout_history wh
    JOIN workouts w ON wh.workout_id = w.id
    WHERE wh.user_id = ?
    ORDER BY wh.completed_at DESC`,
      [userId],
    );

    return rows.map((row) => ({
      id: row.id,
      workoutId: row.workout_id,
      workoutName: row.workout_name,
      completedAt: row.completed_at,
      actualDuration: row.actual_duration,
    }));
  }

  async getWorkoutHistoryDetails(
    historyId: string,
  ): Promise<WorkoutHistoryDetails> {
    const historyRow = await this.db.getFirstAsync<WorkoutHistoryRow>(
      `SELECT wh.*, w.name as workout_name
     FROM workout_history wh
     JOIN workouts w ON wh.workout_id = w.id
     WHERE wh.id = ?`,
      [historyId],
    );

    if (!historyRow) {
      throw new Error('Workout history not found');
    }

    const exercises = await this.getWorkoutExercises(historyRow.workout_id);

    const stats = {
      totalVolume: exercises.reduce(
        (sum, ex) =>
          sum +
          ex.sets.reduce(
            (s, set) => s + (set.actualReps || 0) * (set.actualWeight || 0),
            0,
          ),
        0,
      ),
      completedSets: exercises.reduce(
        (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
        0,
      ),
      totalSets: exercises.reduce((sum, ex) => sum + ex.sets.length, 0),
    };

    return {
      id: historyRow.id,
      workoutId: historyRow.workout_id,
      workoutName: historyRow.workout_name!,
      completedAt: new Date(historyRow.completed_at),
      actualDuration: historyRow.actual_duration,
      exercises,
      stats,
    };
  }

  async getExerciseProgress(
    exerciseId: string,
    userId: string = 'user_1',
  ): Promise<ExerciseProgressWithWorkout[]> {
    const rows = await this.db.getAllAsync<ExerciseProgressQueryRow>(
      `SELECT 
    ep.*, 
    w.name as workout_name 
  FROM exercise_progress ep 
  LEFT JOIN workout_history wh 
    ON DATE(ep.date) = DATE(wh.completed_at) 
    AND wh.user_id = ep.user_id 
  LEFT JOIN workouts w 
    ON wh.workout_id = w.id
  WHERE ep.exercise_id = ? AND ep.user_id = ? 
  ORDER BY ep.date DESC`,
      [exerciseId, userId],
    );

    return rows.map((row) => ({
      id: row.id,
      exerciseId: row.exercise_id,
      date: new Date(row.date),
      maxWeight: row.max_weight,
      totalVolume: row.total_volume,
      personalRecord: row.personal_record === 1,
      workoutName: row.workout_name || undefined,
    }));
  }

  async getWorkoutsThisWeek(userId: string = 'user_1'): Promise<number> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday start
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const result = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count 
     FROM workout_history 
     WHERE user_id = ? 
     AND completed_at >= ? 
     AND completed_at < ?`,
      [userId, startOfWeek.toISOString(), endOfWeek.toISOString()],
    );

    return result?.count || 0;
  }

  async getWorkoutsThisMonth(userId: string = 'user_1'): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const result = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count 
     FROM workout_history 
     WHERE user_id = ? 
     AND completed_at >= ? 
     AND completed_at < ?`,
      [userId, startOfMonth.toISOString(), endOfMonth.toISOString()],
    );

    return result?.count || 0;
  }

  async getCurrentStreak(userId: string = 'user_1'): Promise<number> {
    const rows = await this.db.getAllAsync<{ completed_at: string }>(
      `SELECT DATE(completed_at) as completed_at 
     FROM workout_history 
     WHERE user_id = ? 
     GROUP BY DATE(completed_at)
     ORDER BY completed_at DESC`,
      [userId],
    );

    if (rows.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < rows.length; i++) {
      const workoutDate = new Date(rows[i].completed_at);
      workoutDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - streak);

      // Check if workout is on expected date
      if (workoutDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else if (workoutDate.getTime() < expectedDate.getTime()) {
        break;
      }
    }

    return streak;
  }
}
