import { useEffect } from 'react';
import { useApp } from '@/providers/AppProvider';
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore';
import { useToastStore } from '@/store/toastStore';
import { ServiceError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { WorkoutExerciseWithSets } from '@/types/training';

// Debounced incremental save of the active workout to SQLite, plus a flush on
// unmount so navigating away before the debounce fires still persists.
export function useActiveWorkoutAutosave() {
  const { workoutService } = useApp();
  const { showToast } = useToastStore();
  const exercises = useActiveWorkoutStore((s) => s.exercises);
  const workoutId = useActiveWorkoutStore((s) => s.workoutId);

  const save = (id: string, ex: WorkoutExerciseWithSets[]) => {
    workoutService.saveActiveWorkoutSnapshot(id, ex).catch((error) => {
      logger.error('Active workout autosave failed', error);
      if (error instanceof ServiceError) showToast(error.userMessage, 'error');
    });
  };

  useEffect(() => {
    if (!workoutId || !exercises) return;
    const timer = setTimeout(() => save(workoutId, exercises), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises, workoutId]);

  useEffect(() => {
    return () => {
      // Read fresh state in cleanup; finishActiveWorkout() nulls these, so the
      // guard skips the redundant save on the finish path.
      const { workoutId: id, exercises: ex } = useActiveWorkoutStore.getState();
      if (id && ex) save(id, ex);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
