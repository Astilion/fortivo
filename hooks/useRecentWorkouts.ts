import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { WorkoutHistoryWithDetails } from '@/types/training';
import { useApp } from '@/providers/AppProvider';

export const useRecentWorkouts = (limit: number = 5) => {
  const { workoutService } = useApp();
  const [workouts, setWorkouts] = useState<WorkoutHistoryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const history = await workoutService.getWorkoutHistory();
      setWorkouts(history.slice(0, limit));
    } catch (err) {
      console.error('Failed to load recent workouts:', err);
      setError('Nie udało się załadować ostatnich treningów');
    } finally {
      setLoading(false);
    }
  }, [workoutService, limit]);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts]),
  );
  return { workouts, loading, error, refresh: loadWorkouts };
};
