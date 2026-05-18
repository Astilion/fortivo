import { useApp } from '@/providers/AppProvider';
import { useWeeklyPlanStore } from '@/store/weeklyPlanStore';
import { WeeklyPlanDay, WorkoutHistoryRow } from '@/types/training';
import { DAYS_OF_WEEK } from '@/utils/days';
import { useCallback, useMemo, useState } from 'react';
import { useRefreshOnFocus } from './useRefreshOnFocus';

type DayStatus = 'on_plan' | 'off_plan' | 'none';

export type PlanDay = {
  dayOfWeek: number;
  dayName: string;
  configured: WeeklyPlanDay | undefined;
  status: DayStatus;
};

export const useWeeklyPlanData = () => {
  const { workoutService, weeklyPlanService } = useApp();
  const { activePlan, setActivePlan } = useWeeklyPlanStore();
  const [completedThisWeek, setCompletedThisWeek] = useState<
    WorkoutHistoryRow[]
  >([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshPlan = useCallback(async () => {
    try {
      setLoading(true);
      const [plan, completed] = await Promise.all([
        weeklyPlanService.getActivePlan(),
        workoutService.getCompletedWorkoutsThisWeek(),
      ]);
      setActivePlan(plan);
      setCompletedThisWeek(completed);
    } finally {
      setLoading(false);
    }
  }, [weeklyPlanService, workoutService, setActivePlan]);

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
