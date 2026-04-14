import { create } from 'zustand';
import { WeeklyPlan, Workout } from '@/types/training';

interface WeeklyPlanStore {
  allPlans: WeeklyPlan[];
  activePlan: WeeklyPlan | null;
  pendingWorkout: Workout | null;
  setPlans: (plans: WeeklyPlan[]) => void;
  setActivePlan: (plan: WeeklyPlan | null) => void;
  setPendingWorkout: (workout: Workout | null) => void;
  clearPendingWorkout: () => void;
}

export const useWeeklyPlanStore = create<WeeklyPlanStore>((set) => ({
  allPlans: [],
  activePlan: null,
  pendingWorkout: null,
  setPlans: (plans: WeeklyPlan[]) => set({ allPlans: plans }),
  setActivePlan: (plan: WeeklyPlan | null) => set({ activePlan: plan }),
  setPendingWorkout: (workout: Workout | null) =>
    set({ pendingWorkout: workout }),
  clearPendingWorkout: () => set({ pendingWorkout: null }),
}));
