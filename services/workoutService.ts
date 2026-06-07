import { generateId } from '@/database/database';
import { logger } from '@/utils/logger';
import { ServiceError } from '@/utils/errors';
import { getWeekStart } from '@/utils/days';
import {
  Exercise,
  ExerciseProgressQueryRow,
  ExerciseProgressRow,
  ExerciseProgressWithWorkout,
  ExerciseRow,
  PerformanceSnapshot,
  PerformanceSnapshotExercise,
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
  WorkoutWithCountRow,
} from '@/types/training';
import { LOCAL_USER_ID } from '@/constants/User';
import * as SQLite from 'expo-sqlite';

export class WorkoutService {
  private db: SQLite.SQLiteDatabase;

  constructor(database: SQLite.SQLiteDatabase) {
    this.db = database;
  }

  async getAllWorkouts(): Promise<WorkoutWithCountRow[]> {
    return this.db.getAllAsync<WorkoutWithCountRow>(`
    SELECT 
      workouts.*,
      COUNT (workout_exercises.id) as exercise_count
    FROM workouts
    LEFT JOIN workout_exercises ON workouts.id = workout_exercises.workout_id
    GROUP BY workouts.id
    ORDER BY is_favorite DESC, display_order ASC, created_at DESC
  `);
  }
  async createWorkout(
    workout: Omit<Workout, 'id' | 'createdAt' | 'exercises'>,
  ): Promise<Workout> {
    const id = generateId('workout');
    const createdAt = new Date();

    try {
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
    } catch (error) {
      logger.error('WorkoutService.createWorkout failed', error);
      throw new ServiceError('Nie udało się utworzyć treningu', error);
    }

    return {
      id,
      ...workout,
      exercises: [],
      createdAt,
    } as Workout;
  }

  async deleteWorkout(id: string): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
    } catch (error) {
      logger.error('WorkoutService.deleteWorkout failed', error);
      throw new ServiceError('Nie udało się usunąć treningu', error);
    }
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

    try {
      await this.db.runAsync(
        `UPDATE workouts SET ${fields.join(', ')} WHERE id = ?`,
        values,
      );
    } catch (error) {
      logger.error('WorkoutService.updateWorkout failed', error);
      throw new ServiceError('Nie udało się zaktualizować treningu', error);
    }
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
    try {
      await this.db.withTransactionAsync(async () => {
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
            await this.insertSet(
              generateId('ws'),
              workoutExerciseId,
              j,
              sets[j],
            );
          }
        }
      });
    } catch (error) {
      logger.error('WorkoutService.saveWorkoutExercises failed', error);
      throw new ServiceError('Nie udało się zapisać ćwiczeń treningu', error);
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
        weight: setRow.weight ?? undefined,
        rpe: setRow.rpe ?? undefined,
        tempo: setRow.tempo || undefined,
        restTime: setRow.rest_time ?? undefined,
        completed: setRow.completed === 1,
        notes: setRow.notes || undefined,
        actualReps: setRow.actual_reps ?? undefined,
        actualWeight: setRow.actual_weight ?? undefined,
        actualRpe: setRow.actual_rpe ?? undefined,
        duration: setRow.duration ?? undefined,
        actualDuration: setRow.actual_duration ?? undefined,
        distance: setRow.distance ?? undefined,
        actualDistance: setRow.actual_distance ?? undefined,
      }));

      result.push({
        id: we.id,
        exercise,
        sets,
        isExpanded: false,
      });
    }

    return result;
  }

  // Edit form opens on last-performed values so the plan tracks progression once
  // saved; overlays planned fields with the last finished session's snapshot.
  async getWorkoutExercisesForEdit(
    workoutId: string,
  ): Promise<WorkoutExerciseWithSets[]> {
    const exercises = await this.getWorkoutExercises(workoutId);
    const snapshot = await this.getLatestPerformanceSnapshot(workoutId);
    if (!snapshot) return exercises;

    const queueByExerciseId = new Map<string, PerformanceSnapshotExercise[]>();
    for (const snapEx of snapshot.exercises) {
      const queue = queueByExerciseId.get(snapEx.exerciseId) ?? [];
      queue.push(snapEx);
      queueByExerciseId.set(snapEx.exerciseId, queue);
    }
    const consumed = new Map<string, number>();

    return exercises.map((ex) => {
      const queue = queueByExerciseId.get(ex.exercise.id);
      const idx = consumed.get(ex.exercise.id) ?? 0;
      const snapEx = queue?.[idx];
      if (!snapEx) return ex;
      consumed.set(ex.exercise.id, idx + 1);

      return {
        ...ex,
        sets: ex.sets.map((set, i) => {
          const snapSet = snapEx.sets[i];
          if (!snapSet) return set;
          // `??` not `||`: a real 0 (bodyweight) must overlay as 0.
          return {
            ...set,
            reps: snapSet.actualReps ?? set.reps,
            weight: snapSet.actualWeight ?? set.weight,
            rpe: snapSet.actualRpe ?? set.rpe,
            duration: snapSet.actualDuration ?? set.duration,
            distance: snapSet.actualDistance ?? set.distance,
          };
        }),
      };
    });
  }

  async reorderWorkouts(workoutIds: string[]): Promise<void> {
    // Wrap the per-row UPDATEs so an interruption can't leave a partial ordering.
    try {
      await this.db.withTransactionAsync(async () => {
        for (let i = 0; i < workoutIds.length; i++) {
          await this.db.runAsync(
            'UPDATE workouts SET display_order = ? WHERE id = ?',
            [i, workoutIds[i]],
          );
        }
      });
    } catch (error) {
      logger.error('WorkoutService.reorderWorkouts failed', error);
      throw new ServiceError(
        'Nie udało się zmienić kolejności treningów',
        error,
      );
    }
  }

  async setActiveWorkout(id: string): Promise<void> {
    // Wrap all writes so we never end up with zero or two active rows if
    // interrupted between them. started_at marks the activation moment, used
    // to compute workout duration and survive a process kill.
    try {
      await this.db.withTransactionAsync(async () => {
        await this.db.runAsync('UPDATE workouts SET is_active = 0');
        await this.db.runAsync(
          'UPDATE workouts SET is_active = 1, started_at = ? WHERE id = ?',
          [new Date().toISOString(), id],
        );
        // Clean slate first (deterministic regardless of any leftover from a
        // discarded session), then seed actuals from the last finished session
        // so the workout opens pre-filled with what was lifted last time.
        // completed stays 0 — values are suggestions, not checked-off sets.
        await this.db.runAsync(
          `UPDATE workout_sets
           SET actual_reps = NULL, actual_weight = NULL, actual_rpe = NULL,
               actual_duration = NULL, actual_distance = NULL, completed = 0
           WHERE workout_exercise_id IN (
             SELECT id FROM workout_exercises WHERE workout_id = ?
           )`,
          [id],
        );
        await this.seedActualsFromLastSession(id);
      });
    } catch (error) {
      logger.error('WorkoutService.setActiveWorkout failed', error);
      throw new ServiceError('Nie udało się ustawić aktywnego treningu', error);
    }
  }

  // Latest finished session's frozen snapshot for a workout, or null when there
  // is none / it is corrupt — callers fall back to planned values.
  private async getLatestPerformanceSnapshot(
    workoutId: string,
  ): Promise<PerformanceSnapshot | null> {
    const row = await this.db.getFirstAsync<{ performance_data: string }>(
      `SELECT performance_data FROM workout_history
       WHERE workout_id = ? AND performance_data IS NOT NULL
       ORDER BY completed_at DESC LIMIT 1`,
      [workoutId],
    );
    if (!row) return null;

    try {
      return JSON.parse(row.performance_data) as PerformanceSnapshot;
    } catch (error) {
      logger.error(
        'WorkoutService.getLatestPerformanceSnapshot parse failed',
        error,
      );
      return null;
    }
  }

  // Prefill workout_sets.actual_* from the most recent finished session's frozen
  // snapshot. Best-effort: matches exercises by id (queueing duplicates by order)
  // and sets by set_order index, so an edited plan (add/remove/reorder) never
  // crashes — unmatched sets keep their NULL actuals and fall back to planned.
  private async seedActualsFromLastSession(workoutId: string): Promise<void> {
    const snapshot = await this.getLatestPerformanceSnapshot(workoutId);
    if (!snapshot) return;

    const workoutExercises = await this.db.getAllAsync<{
      id: string;
      exercise_id: string;
    }>(
      `SELECT id, exercise_id FROM workout_exercises
       WHERE workout_id = ? ORDER BY exercise_order ASC`,
      [workoutId],
    );

    const queueByExerciseId = new Map<string, string[]>();
    for (const we of workoutExercises) {
      const queue = queueByExerciseId.get(we.exercise_id) ?? [];
      queue.push(we.id);
      queueByExerciseId.set(we.exercise_id, queue);
    }
    const consumed = new Map<string, number>();

    for (const snapEx of snapshot.exercises) {
      const queue = queueByExerciseId.get(snapEx.exerciseId);
      if (!queue) continue;
      const idx = consumed.get(snapEx.exerciseId) ?? 0;
      if (idx >= queue.length) continue;
      consumed.set(snapEx.exerciseId, idx + 1);

      const setRows = await this.db.getAllAsync<{ id: string }>(
        `SELECT id FROM workout_sets
         WHERE workout_exercise_id = ? ORDER BY set_order ASC`,
        [queue[idx]],
      );

      for (let i = 0; i < setRows.length; i++) {
        const snapSet = snapEx.sets[i];
        if (!snapSet) continue;
        await this.db.runAsync(
          `UPDATE workout_sets SET
             actual_reps = ?, actual_weight = ?, actual_rpe = ?,
             actual_duration = ?, actual_distance = ?
           WHERE id = ?`,
          [
            snapSet.actualReps,
            snapSet.actualWeight,
            snapSet.actualRpe,
            snapSet.actualDuration,
            snapSet.actualDistance,
            setRows[i].id,
          ],
        );
      }
    }
  }

  async getActiveWorkout(): Promise<WorkoutRow | null> {
    const row = await this.db.getFirstAsync<WorkoutRow>(
      'SELECT * FROM workouts WHERE is_active = 1 LIMIT 1',
    );
    return row || null;
  }

  private async _resetActiveWorkoutDB(workoutId: string): Promise<void> {
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `UPDATE workout_sets
         SET actual_reps = NULL, actual_weight = NULL, actual_rpe = NULL,
             actual_duration = NULL, actual_distance = NULL, completed = 0
         WHERE workout_exercise_id IN (
           SELECT id FROM workout_exercises WHERE workout_id = ?
         )`,
        [workoutId],
      );
      await this.db.runAsync(
        'UPDATE workouts SET is_active = 0, started_at = NULL WHERE id = ?',
        [workoutId],
      );
    });
  }

  async deactivateActiveWorkout(workoutId: string): Promise<void> {
    try {
      await this.db.runAsync(
        'UPDATE workouts SET is_active = 0, started_at = NULL WHERE id = ?',
        [workoutId],
      );
    } catch (error) {
      logger.error('WorkoutService.deactivateActiveWorkout failed', error);
      throw new ServiceError('Nie udało się zakończyć treningu', error);
    }
  }

  async clearActiveWorkout(workoutId: string): Promise<void> {
    await this.deactivateActiveWorkout(workoutId);
  }

  async clearStaleActiveWorkout(workoutId: string): Promise<void> {
    try {
      await this._resetActiveWorkoutDB(workoutId);
    } catch (error) {
      logger.error('WorkoutService.clearStaleActiveWorkout failed', error);
      throw new ServiceError(
        'Nie udało się wyczyścić wygasłego treningu',
        error,
      );
    }
  }

  async discardActiveWorkout(workoutId: string): Promise<void> {
    try {
      await this._resetActiveWorkoutDB(workoutId);
    } catch (error) {
      logger.error('WorkoutService.discardActiveWorkout failed', error);
      throw new ServiceError('Nie udało się odrzucić treningu', error);
    }
  }

  // Incremental persistence for the in-progress active workout. UPSERTs on the
  // stable ids supplied by the store (no DELETE+reinsert, so refs/ids survive),
  // then prunes exercises/sets the user removed.
  async saveActiveWorkoutSnapshot(
    workoutId: string,
    exercises: WorkoutExerciseWithSets[],
  ): Promise<void> {
    try {
      await this.db.withTransactionAsync(async () => {
        for (let i = 0; i < exercises.length; i++) {
          const { id, exercise, sets } = exercises[i];

          await this.db.runAsync(
            `INSERT INTO workout_exercises (
              id, workout_id, exercise_id, exercise_order, superset_group, notes
            ) VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET exercise_order = excluded.exercise_order`,
            [id, workoutId, exercise.id, i, null, null],
          );

          for (let j = 0; j < sets.length; j++) {
            await this.upsertSet(sets[j].id, id, j, sets[j]);
          }

          await this.deleteRowsNotIn(
            'workout_sets',
            'workout_exercise_id',
            id,
            sets.map((s) => s.id),
          );
        }

        // CASCADE clears the sets of any pruned exercise.
        await this.deleteRowsNotIn(
          'workout_exercises',
          'workout_id',
          workoutId,
          exercises.map((e) => e.id),
        );
      });
    } catch (error) {
      logger.error('WorkoutService.saveActiveWorkoutSnapshot failed', error);
      throw new ServiceError('Nie udało się zapisać postępu treningu', error);
    }
  }

  async saveWorkoutHistory(
    workoutId: string,
    workoutName: string | null,
    durationMinutes: number,
    exercises: WorkoutExerciseWithSets[],
  ): Promise<void> {
    const id = generateId('wh');
    const userId = LOCAL_USER_ID;

    // Frozen copy: re-running the workout overwrites the live sets, which would
    // otherwise mutate this past entry.
    const snapshot: PerformanceSnapshot = {
      version: 1,
      exercises: exercises.map((ex) => ({
        exerciseId: ex.exercise.id,
        name: ex.exercise.name,
        measurementType: ex.exercise.measurementType ?? 'reps',
        sets: ex.sets.map((s) => ({
          completed: s.completed,
          reps: s.reps ?? null,
          weight: s.weight ?? null,
          rpe: s.rpe ?? null,
          tempo: s.tempo ?? null,
          duration: s.duration ?? null,
          distance: s.distance ?? null,
          actualReps: s.actualReps ?? null,
          actualWeight: s.actualWeight ?? null,
          actualRpe: s.actualRpe ?? null,
          actualDuration: s.actualDuration ?? null,
          actualDistance: s.actualDistance ?? null,
        })),
      })),
    };

    try {
      await this.db.runAsync(
        `INSERT INTO workout_history (
          id, workout_id, workout_name, user_id, completed_at, actual_duration,
          performance_notes, performance_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          workoutId,
          workoutName ?? null,
          userId,
          new Date().toISOString(),
          durationMinutes,
          null,
          JSON.stringify(snapshot),
        ],
      );
    } catch (error) {
      logger.error('WorkoutService.saveWorkoutHistory failed', error);
      throw new ServiceError('Nie udało się zapisać historii treningu', error);
    }
  }

  async saveExerciseProgress(
    workoutId: string,
    exercises: WorkoutExerciseWithSets[],
  ): Promise<void> {
    const userId = LOCAL_USER_ID;
    const date = new Date().toISOString();

    try {
      await this.db.withTransactionAsync(async () => {
        for (const ex of exercises) {
          // Progress is weight/reps based (max weight, volume = reps × weight).
          // Time/distance exercises have no meaningful values here — skip them.
          const measurementType = ex.exercise.measurementType;
          if (measurementType === 'time' || measurementType === 'distance') {
            continue;
          }

          const completedSets = ex.sets.filter((s) => s.completed);
          if (completedSets.length === 0) continue;

          const maxWeight = Math.max(
            ...completedSets.map((s) => s.actualWeight || 0),
          );

          const totalVolume = completedSets.reduce(
            (sum, set) => sum + (set.actualReps || 0) * (set.actualWeight || 0),
            0,
          );

          const previousRecord =
            await this.db.getFirstAsync<ExerciseProgressRow>(
              `SELECT * FROM exercise_progress
             WHERE exercise_id = ? AND user_id = ?
             ORDER BY max_weight DESC LIMIT 1`,
              [ex.exercise.id, userId],
            );

          const isPersonalRecord =
            !previousRecord || maxWeight > previousRecord.max_weight;

          await this.db.runAsync(
            `INSERT INTO exercise_progress (
              id, exercise_id, user_id, date, max_weight, total_volume,
              estimated_one_rep_max, personal_record
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              generateId('ep'),
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
      });
    } catch (error) {
      logger.error('WorkoutService.saveExerciseProgress failed', error);
      throw new ServiceError('Nie udało się zapisać postępu ćwiczeń', error);
    }
  }

  async getWorkoutHistory(
    userId: string = LOCAL_USER_ID,
  ): Promise<WorkoutHistoryWithDetails[]> {
    const rows = await this.db.getAllAsync<WorkoutHistoryQueryRow>(
      `SELECT wh.id, wh.workout_id, wh.workout_name, wh.completed_at, wh.actual_duration
       FROM workout_history wh
       WHERE wh.user_id = ?
       ORDER BY wh.completed_at DESC`,
      [userId],
    );

    return rows.map((row) => ({
      id: row.id,
      workoutId: row.workout_id,
      workoutName: row.workout_name ?? 'Usunięty trening',
      completedAt: row.completed_at,
      actualDuration: row.actual_duration,
    }));
  }

  async getWorkoutHistoryDetails(
    historyId: string,
  ): Promise<WorkoutHistoryDetails> {
    const historyRow = await this.db.getFirstAsync<WorkoutHistoryRow>(
      `SELECT * FROM workout_history WHERE id = ?`,
      [historyId],
    );

    if (!historyRow) {
      throw new Error('Workout history not found');
    }

    let exercises: WorkoutExerciseWithSets[];
    if (historyRow.performance_data) {
      exercises = this.deserializePerformanceSnapshot(
        historyRow.performance_data,
        historyRow.completed_at,
      );
    } else if (historyRow.workout_id) {
      // Legacy: entries from before v8 have no snapshot — read live tables.
      exercises = await this.getWorkoutExercises(historyRow.workout_id);
    } else {
      // Pre-v8 entry whose workout was since deleted — nothing left to read.
      exercises = [];
    }

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
      workoutName: historyRow.workout_name ?? 'Usunięty trening',
      completedAt: new Date(historyRow.completed_at),
      actualDuration: historyRow.actual_duration,
      exercises,
      stats,
    };
  }

  private deserializePerformanceSnapshot(
    json: string,
    completedAt: string,
  ): WorkoutExerciseWithSets[] {
    const snapshot = JSON.parse(json) as PerformanceSnapshot;

    return snapshot.exercises.map((ex, exIndex) => {
      // History render only touches id/name/measurementType; rest is stubbed.
      const exercise: Exercise = {
        id: ex.exerciseId,
        name: ex.name,
        measurementType: ex.measurementType,
        categories: [],
        muscleGroups: [],
        isCustom: false,
        createdAt: new Date(completedAt),
      };

      const sets: WorkoutSet[] = ex.sets.map((s, setIndex) => ({
        id: `snap_${exIndex}_${setIndex}`,
        completed: s.completed,
        reps: s.reps ?? 0,
        weight: s.weight ?? undefined,
        rpe: s.rpe ?? undefined,
        tempo: s.tempo ?? undefined,
        duration: s.duration ?? undefined,
        distance: s.distance ?? undefined,
        actualReps: s.actualReps ?? undefined,
        actualWeight: s.actualWeight ?? undefined,
        actualRpe: s.actualRpe ?? undefined,
        actualDuration: s.actualDuration ?? undefined,
        actualDistance: s.actualDistance ?? undefined,
      }));

      return { id: `snapex_${exIndex}`, exercise, sets, isExpanded: false };
    });
  }

  async countWorkouts(): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM workouts',
    );
    return result?.count || 0;
  }

  async getExerciseProgress(
    exerciseId: string,
    userId: string = LOCAL_USER_ID,
  ): Promise<ExerciseProgressWithWorkout[]> {
    const rows = await this.db.getAllAsync<ExerciseProgressQueryRow>(
      `SELECT ep.*, wh.workout_name as workout_name
       FROM exercise_progress ep
       LEFT JOIN workout_history wh
         ON DATE(ep.date) = DATE(wh.completed_at) AND wh.user_id = ep.user_id
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

  async getWorkoutsThisWeek(
    weekStartsOn: number,
    userId: string = LOCAL_USER_ID,
  ): Promise<number> {
    const startOfWeek = getWeekStart(new Date(), weekStartsOn);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const result = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM workout_history 
       WHERE user_id = ? AND completed_at >= ? AND completed_at < ?`,
      [userId, startOfWeek.toISOString(), endOfWeek.toISOString()],
    );

    return result?.count || 0;
  }

  async getWorkoutsThisMonth(userId: string = LOCAL_USER_ID): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const result = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM workout_history 
       WHERE user_id = ? AND completed_at >= ? AND completed_at < ?`,
      [userId, startOfMonth.toISOString(), endOfMonth.toISOString()],
    );

    return result?.count || 0;
  }

  async getTotalWorkouts(userId: string = LOCAL_USER_ID): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM workout_history WHERE user_id = ?`,
      [userId],
    );
    return result?.count || 0;
  }

  /** Reusable INSERT for workout_sets — used by saveWorkoutExercises */
  private async insertSet(
    setId: string,
    workoutExerciseId: string,
    order: number,
    set: WorkoutSet,
  ): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO workout_sets (
        id, workout_exercise_id, set_order, reps, weight, rpe, 
        tempo, rest_time, completed, notes, actual_reps, actual_weight, actual_rpe,
        duration, actual_duration, distance, actual_distance
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        setId,
        workoutExerciseId,
        order,
        set.reps,
        set.weight ?? null,
        set.rpe || null,
        set.tempo || null,
        set.restTime ?? null,
        set.completed ? 1 : 0,
        set.notes || null,
        set.actualReps || null,
        set.actualWeight ?? null,
        set.actualRpe || null,
        set.duration ?? null,
        set.actualDuration ?? null,
        set.distance ?? null,
        set.actualDistance ?? null,
      ],
    );
  }

  /** Like insertSet but UPSERTs on id — used by saveActiveWorkoutSnapshot.
   *  Uses `?? null` (not `|| null`) so a legit 0 (failed set, bodyweight) is
   *  stored as 0 rather than collapsing to NULL. */
  private async upsertSet(
    setId: string,
    workoutExerciseId: string,
    order: number,
    set: WorkoutSet,
  ): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO workout_sets (
        id, workout_exercise_id, set_order, reps, weight, rpe,
        tempo, rest_time, completed, notes, actual_reps, actual_weight, actual_rpe,
        duration, actual_duration, distance, actual_distance
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        workout_exercise_id = excluded.workout_exercise_id,
        set_order = excluded.set_order,
        reps = excluded.reps,
        weight = excluded.weight,
        rpe = excluded.rpe,
        tempo = excluded.tempo,
        rest_time = excluded.rest_time,
        completed = excluded.completed,
        notes = excluded.notes,
        actual_reps = excluded.actual_reps,
        actual_weight = excluded.actual_weight,
        actual_rpe = excluded.actual_rpe,
        duration = excluded.duration,
        actual_duration = excluded.actual_duration,
        distance = excluded.distance,
        actual_distance = excluded.actual_distance`,
      [
        setId,
        workoutExerciseId,
        order,
        set.reps,
        set.weight ?? null,
        set.rpe ?? null,
        set.tempo ?? null,
        set.restTime ?? null,
        set.completed ? 1 : 0,
        set.notes ?? null,
        set.actualReps ?? null,
        set.actualWeight ?? null,
        set.actualRpe ?? null,
        set.duration ?? null,
        set.actualDuration ?? null,
        set.distance ?? null,
        set.actualDistance ?? null,
      ],
    );
  }

  // Diff-aware prune for saveActiveWorkoutSnapshot: drops rows no longer present.
  private async deleteRowsNotIn(
    table: 'workout_exercises' | 'workout_sets',
    parentColumn: string,
    parentId: string,
    keepIds: string[],
  ): Promise<void> {
    if (keepIds.length === 0) {
      await this.db.runAsync(`DELETE FROM ${table} WHERE ${parentColumn} = ?`, [
        parentId,
      ]);
      return;
    }
    const placeholders = keepIds.map(() => '?').join(', ');
    await this.db.runAsync(
      `DELETE FROM ${table} WHERE ${parentColumn} = ? AND id NOT IN (${placeholders})`,
      [parentId, ...keepIds],
    );
  }

  async toggleFavoriteWorkout(id: string): Promise<boolean> {
    const workout = await this.getWorkoutById(id);
    if (!workout) return false;

    const newValue = workout.is_favorite === 1 ? 0 : 1;
    try {
      await this.db.runAsync(
        'UPDATE workouts SET is_favorite = ? WHERE id = ?',
        [newValue, id],
      );
    } catch (error) {
      logger.error('WorkoutService.toggleFavoriteWorkout failed', error);
      throw new ServiceError(
        'Nie udało się zmienić ulubionego treningu',
        error,
      );
    }
    return newValue === 1;
  }

  async getCompletedWorkoutsThisWeek(
    weekStartsOn: number,
    userId = LOCAL_USER_ID,
  ): Promise<WorkoutHistoryRow[]> {
    const startOfWeek = getWeekStart(new Date(), weekStartsOn);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return this.db.getAllAsync<WorkoutHistoryRow>(
      `SELECT * FROM workout_history 
     WHERE user_id = ? AND completed_at >= ? AND completed_at < ?`,
      [userId, startOfWeek.toISOString(), endOfWeek.toISOString()],
    );
  }
}
