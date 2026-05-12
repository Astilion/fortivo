import { create } from 'zustand';
import { WeeklyPlan, WeeklyPlanWithDays, Workout } from '@/types/training';

interface WeeklyPlanStore {
  weeklyPlans: WeeklyPlanWithDays[];
  activePlan: WeeklyPlan | null;
  pendingWorkout: Workout | null;
  setWeeklyPlans: (plans: WeeklyPlanWithDays[]) => void;
  setActivePlan: (plan: WeeklyPlan | null) => void;
  setPendingWorkout: (workout: Workout | null) => void;
  clearPendingWorkout: () => void;
}

export const useWeeklyPlanStore = create<WeeklyPlanStore>((set) => ({
  weeklyPlans: [],
  activePlan: null,
  pendingWorkout: null,
  setWeeklyPlans: (plans: WeeklyPlanWithDays[]) => set({ weeklyPlans: plans }),
  setActivePlan: (plan: WeeklyPlan | null) => set({ activePlan: plan }),
  setPendingWorkout: (workout: Workout | null) =>
    set({ pendingWorkout: workout }),
  clearPendingWorkout: () => set({ pendingWorkout: null }),
}));
