import { create } from 'zustand';

// In-memory only (NO persist middleware). SQLite is the single source of truth;
// this store is hydrated from the DB on app boot (see AppProvider) so the active
// workout survives a process kill.
interface ActiveWorkoutState {
  workoutId: string | null;
  workoutStartTime: number | null; // ms from epoch (Date.now())

  // startTime omitted = fresh start (Date.now()); passed = hydration from DB.
  startActiveWorkout: (workoutId: string, startTime?: number) => void;
  finishActiveWorkout: () => void;
  // Alias to finishActiveWorkout — used by the timeout cleanup in a later commit.
  reset: () => void;
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>((set) => ({
  workoutId: null,
  workoutStartTime: null,

  startActiveWorkout: (workoutId: string, startTime?: number) =>
    set({ workoutId, workoutStartTime: startTime ?? Date.now() }),

  finishActiveWorkout: () => set({ workoutId: null, workoutStartTime: null }),

  reset: () => set({ workoutId: null, workoutStartTime: null }),
}));
