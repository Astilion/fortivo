import { generateId } from '@/database/database';
import { logger } from '@/utils/logger';
import { ServiceError } from '@/utils/errors';
import { PRESET_WORKOUTS } from '@/constants/PresetWorkouts';
import { PresetWorkout } from '@/types/presets';
import * as SQLite from 'expo-sqlite';

export class PresetService {
  private db: SQLite.SQLiteDatabase;

  constructor(database: SQLite.SQLiteDatabase) {
    this.db = database;
  }

  getPresetWorkouts(): PresetWorkout[] {
    return PRESET_WORKOUTS;
  }

  getPresetWorkoutById(id: string): PresetWorkout | null {
    return PRESET_WORKOUTS.find((preset) => preset.id === id) ?? null;
  }

  async copyPresetWorkoutToUserWorkouts(presetId: string): Promise<string> {
    const preset = this.getPresetWorkoutById(presetId);
    if (!preset) {
      throw new ServiceError('Nie znaleziono gotowego treningu');
    }

    const workoutId = generateId('workout');
    const nowIso = new Date().toISOString();

    try {
      await this.db.withTransactionAsync(async () => {
        await this.db.runAsync(
          `INSERT INTO workouts (
            id, name, date, duration, notes, tags, completed, template_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            workoutId,
            preset.name,
            nowIso,
            null,
            null,
            preset.tags ? JSON.stringify(preset.tags) : null,
            0,
            null,
            nowIso,
          ],
        );

        for (const presetExercise of preset.exercises) {
          const workoutExerciseId = generateId('we');

          await this.db.runAsync(
            `INSERT INTO workout_exercises (
              id, workout_id, exercise_id, exercise_order, superset_group, notes
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              workoutExerciseId,
              workoutId,
              presetExercise.exerciseId,
              presetExercise.order,
              null,
              presetExercise.notes ?? null,
            ],
          );

          for (const presetSet of presetExercise.sets) {
            await this.db.runAsync(
              `INSERT INTO workout_sets (
                id, workout_exercise_id, set_order, reps, weight, rpe,
                tempo, rest_time, completed, notes, actual_reps, actual_weight, actual_rpe,
                duration, actual_duration, distance, actual_distance
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                generateId('ws'),
                workoutExerciseId,
                presetSet.setOrder,
                presetSet.reps,
                null,
                presetSet.rpe ?? null,
                presetSet.tempo ?? null,
                presetSet.restTime ?? null,
                0,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
              ],
            );
          }
        }
      });
    } catch (error) {
      logger.error(
        'PresetService.copyPresetWorkoutToUserWorkouts failed',
        error,
      );
      throw new ServiceError(
        'Nie udało się dodać gotowego treningu do twoich treningów',
        error,
      );
    }

    logger.db(`Copied preset ${presetId} to workout ${workoutId}`);
    return workoutId;
  }
}
