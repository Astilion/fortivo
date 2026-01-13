import { useApp } from '@/providers/AppProvider';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

interface DashboardStats {
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  currentStreak: number;
}

export const useDashboardStats = () => {
  const { workoutService } = useApp();

  const [stats, setStats] = useState<DashboardStats>({
    workoutsThisWeek: 0,
    workoutsThisMonth: 0,
    currentStreak: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); 

      const [week, month, streak] = await Promise.all([
        workoutService.getWorkoutsThisWeek(),
        workoutService.getWorkoutsThisMonth(),
        workoutService.getCurrentStreak(),
      ]);

      setStats({
        workoutsThisWeek: week,
        workoutsThisMonth: month,
        currentStreak: streak,
      });
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setError('Nie udało się załadować statystyk'); 
    } finally {
      setLoading(false);
    }
  }, [workoutService]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  return { stats, loading, error, refresh: loadStats };
};
