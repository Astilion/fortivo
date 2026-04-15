import { create } from 'zustand';
import { WeeklyPlan, Workout } from '@/types/training';

interface WeeklyPlanStore {
  weeklyPlans: WeeklyPlan[];
  activePlan: WeeklyPlan | null;
  pendingWorkout: Workout | null;
  setWeeklyPlans: (plans: WeeklyPlan[]) => void;
  setActivePlan: (plan: WeeklyPlan | null) => void;
  setPendingWorkout: (workout: Workout | null) => void;
  clearPendingWorkout: () => void;
}

export const useWeeklyPlanStore = create<WeeklyPlanStore>((set) => ({
  weeklyPlans: [],
  activePlan: null,
  pendingWorkout: null,
  setWeeklyPlans: (plans: WeeklyPlan[]) => set({ weeklyPlans: plans }),
  setActivePlan: (plan: WeeklyPlan | null) => set({ activePlan: plan }),
  setPendingWorkout: (workout: Workout | null) =>
    set({ pendingWorkout: workout }),
  clearPendingWorkout: () => set({ pendingWorkout: null }),
}));
