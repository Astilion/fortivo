import { PRESET_WORKOUTS } from '@/constants/PresetWorkouts';
import { ExerciseService } from '@/services/exerciseService';
import { logger } from '@/utils/logger';

// Validates that every exerciseId referenced in PRESET_WORKOUTS exists in the
// exercises database. DEV-only. Surfaces broken presets before they ship.
export async function validatePresets(
  exerciseService: ExerciseService,
): Promise<void> {
  if (!__DEV__) return;

  try {
    const exercises = await exerciseService.getAllExercises();
    const knownIds = new Set(exercises.map((ex) => ex.id));

    let issues = 0;
    for (const preset of PRESET_WORKOUTS) {
      for (const presetExercise of preset.exercises) {
        if (!knownIds.has(presetExercise.exerciseId)) {
          issues += 1;
          logger.error(
            `Preset "${preset.id}" references missing exercise "${presetExercise.exerciseId}"`,
          );
        }

        for (const set of presetExercise.sets) {
          const defined = [set.reps, set.duration, set.distance].filter(
            (v) => v !== undefined,
          ).length;
          if (defined !== 1) {
            issues += 1;
            logger.warn(
              `Preset "${preset.id}" exercise "${presetExercise.exerciseId}" set ${set.setOrder} has ${defined} measurements (expected exactly one of reps/duration/distance)`,
            );
          }
        }
      }
    }

    logger.log(
      `${PRESET_WORKOUTS.length} preset workouts validated, ${issues} issues`,
    );
  } catch (error) {
    logger.error('validatePresets failed', error);
  }
}
