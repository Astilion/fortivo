import { useApp } from '@/providers/AppProvider';
import { WorkoutHistoryWithDetails } from '@/types/training';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export const useWorkoutHistory = () => {
  const { workoutService } = useApp();
  const [history, setHistory] = useState<WorkoutHistoryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await workoutService.getWorkoutHistory();
      setHistory(data);
    } catch (err) {
      console.error('Error loading workout history:', err);
      setError('Nie udało się załadować historii treningów');
    } finally {
      setLoading(false);
    }
  }, [workoutService]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  return { history, loading, error, refresh: loadHistory };
};
