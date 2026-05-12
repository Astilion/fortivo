import { useApp } from '@/providers/AppProvider';
import { WorkoutHistoryWithDetails } from '@/types/training';
import { useCallback } from 'react';
import { useAsyncLoader } from './useAsyncLoader';
import { useRefreshOnFocus } from './useRefreshOnFocus';

export const useWorkoutHistory = () => {
  const { workoutService } = useApp();
  const loader = useCallback(
    () => workoutService.getWorkoutHistory(),
    [workoutService],
  );
  const { data: history, loading, error, reload } = useAsyncLoader<WorkoutHistoryWithDetails[]>(loader, []);
  useRefreshOnFocus(reload, [reload]);
  return { history, loading, error, refresh: reload };
};
