import { useApp } from '@/providers/AppProvider';
import { useWeeklyPlanStore } from '@/store/weeklyPlanStore';
import { WeeklyPlanDay, WorkoutHistoryRow } from '@/types/training';
import { DAYS_OF_WEEK } from '@/utils/days';
import { LOCAL_USER_ID } from '@/constants/User';
import { useCallback, useMemo, useState } from 'react';
import { useRefreshOnFocus } from './useRefreshOnFocus';
import { useToastStore } from '@/store/toastStore';
import { ServiceError } from '@/utils/errors';
import { logger } from '@/utils/logger';

type DayStatus = 'on_plan' | 'off_plan' | 'none';

export type PlanDay = {
  dayOfWeek: number;
  dayName: string;
  configured: WeeklyPlanDay | undefined;
  status: DayStatus;
};

export const useWeeklyPlanData = () => {
  const { workoutService, weeklyPlanService, profileService } = useApp();
  const { activePlan, setActivePlan } = useWeeklyPlanStore();
  const [completedThisWeek, setCompletedThisWeek] = useState<
    WorkoutHistoryRow[]
  >([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToastStore();

  const refreshPlan = useCallback(async () => {
    try {
      setLoading(true);
      const { weekStartsOn } =
        await profileService.getUserSettings(LOCAL_USER_ID);
      const [plan, completed] = await Promise.all([
        weeklyPlanService.getActivePlan(),
        workoutService.getCompletedWorkoutsThisWeek(weekStartsOn),
      ]);
      setActivePlan(plan);
      setCompletedThisWeek(completed);
    } catch (error) {
      logger.error('Failed to load weekly plan', error);
      showToast(
        error instanceof ServiceError
          ? error.userMessage
          : 'Nie udało się załadować planu',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [
    weeklyPlanService,
    workoutService,
    profileService,
    setActivePlan,
    showToast,
  ]);

  useRefreshOnFocus(refreshPlan, [refreshPlan]);

  const planDays = useMemo<PlanDay[]>(
    () =>
      DAYS_OF_WEEK.map((day) => {
        const configured = activePlan?.days.find(
          (d) => d.dayOfWeek === day.dayOfWeek,
        );
        const workoutsFromDay = completedThisWeek.filter(
          (row) => new Date(row.completed_at).getDay() === day.dayOfWeek,
        );
        let status: DayStatus = 'none';
        if (workoutsFromDay.length > 0) {
          status = workoutsFromDay.some(
            (r) => r.workout_id === (configured?.workout?.id ?? null),
          )
            ? 'on_plan'
            : 'off_plan';
        }
        return { ...day, configured, status };
      }),
    [activePlan, completedThisWeek],
  );

  return {
    activePlan,
    planDays,
    selectedDay,
    setSelectedDay,
    loading,
    refreshPlan,
  };
};
