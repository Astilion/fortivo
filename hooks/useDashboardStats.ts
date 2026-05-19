import { useApp } from '@/providers/AppProvider';
import { useCallback, useState } from 'react';
import { logger } from '@/utils/logger';
import { LOCAL_USER_ID } from '@/constants/User';
import { useRefreshOnFocus } from './useRefreshOnFocus';

interface DashboardStats {
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  totalWorkouts: number;
}

export const useDashboardStats = () => {
  const { workoutService, profileService } = useApp();

  const [stats, setStats] = useState<DashboardStats>({
    workoutsThisWeek: 0,
    workoutsThisMonth: 0,
    totalWorkouts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { weekStartsOn } =
        await profileService.getUserSettings(LOCAL_USER_ID);

      const [week, month, total] = await Promise.all([
        workoutService.getWorkoutsThisWeek(weekStartsOn),
        workoutService.getWorkoutsThisMonth(),
        workoutService.getTotalWorkouts(),
      ]);

      setStats({
        workoutsThisWeek: week,
        workoutsThisMonth: month,
        totalWorkouts: total,
      });
    } catch (err) {
      logger.error('Failed to load dashboard stats', err);
      setError('Nie udało się załadować statystyk');
    } finally {
      setLoading(false);
    }
  }, [workoutService, profileService]);

  useRefreshOnFocus(loadStats, [loadStats]);

  return { stats, loading, error, refresh: loadStats };
};
