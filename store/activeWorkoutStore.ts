import { create } from 'zustand';
import { WorkoutExerciseWithSets, WorkoutSet } from '@/types/training';

// In-memory only (NO persist middleware). SQLite is the single source of truth;
// this store is hydrated from the DB on boot and on screen mount, so the active
// workout survives a process kill.
interface ActiveWorkoutState {
  workoutId: string | null;
  workoutStartTime: number | null; // ms from epoch (Date.now())
  exercises: WorkoutExerciseWithSets[] | null;
  restTargetTime: number | null; // absolute target, Date.now()-based
  isResting: boolean;

  // startTime omitted = fresh start (Date.now()); passed = hydration from DB.
  startActiveWorkout: (workoutId: string, startTime?: number) => void;
  finishActiveWorkout: () => void;
  reset: () => void; // alias to finishActiveWorkout (timeout cleanup, later commit)

  setExercises: (exercises: WorkoutExerciseWithSets[]) => void;
  updateSetValue: (
    exerciseId: string,
    setId: string,
    updates: Partial<WorkoutSet>,
  ) => void;
  // Returns the new `completed` value — the screen needs it to decide whether to
  // start the rest timer (which depends on user settings it owns).
  toggleSetCompleted: (exerciseId: string, setId: string) => boolean;
  addExercise: (exercise: WorkoutExerciseWithSets) => void;
  addSet: (exerciseId: string, defaultSet: WorkoutSet) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  removeExercise: (exerciseId: string) => void;

  startRestTimer: (targetTime: number) => void;
  stopRestTimer: () => void;
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>((set) => ({
  workoutId: null,
  workoutStartTime: null,
  exercises: null,
  restTargetTime: null,
  isResting: false,

  startActiveWorkout: (workoutId: string, startTime?: number) =>
    set({ workoutId, workoutStartTime: startTime ?? Date.now() }),

  finishActiveWorkout: () =>
    set({
      workoutId: null,
      workoutStartTime: null,
      exercises: null,
      restTargetTime: null,
      isResting: false,
    }),

  reset: () =>
    set({
      workoutId: null,
      workoutStartTime: null,
      exercises: null,
      restTargetTime: null,
      isResting: false,
    }),

  setExercises: (exercises: WorkoutExerciseWithSets[]) => set({ exercises }),

  updateSetValue: (
    exerciseId: string,
    setId: string,
    updates: Partial<WorkoutSet>,
  ) =>
    set((state) => ({
      exercises:
        state.exercises?.map((ex) =>
          ex.id === exerciseId
            ? {
                ...ex,
                sets: ex.sets.map((s) =>
                  s.id === setId ? { ...s, ...updates } : s,
                ),
              }
            : ex,
        ) ?? null,
    })),

  toggleSetCompleted: (exerciseId: string, setId: string) => {
    let next = false;
    set((state) => ({
      exercises:
        state.exercises?.map((ex) =>
          ex.id === exerciseId
            ? {
                ...ex,
                sets: ex.sets.map((s) => {
                  if (s.id !== setId) return s;
                  next = !s.completed;
                  return { ...s, completed: next };
                }),
              }
            : ex,
        ) ?? null,
    }));
    return next;
  },

  addExercise: (exercise: WorkoutExerciseWithSets) =>
    set((state) => ({
      exercises: [...(state.exercises ?? []), exercise],
    })),

  addSet: (exerciseId: string, defaultSet: WorkoutSet) =>
    set((state) => ({
      exercises:
        state.exercises?.map((ex) =>
          ex.id === exerciseId ? { ...ex, sets: [...ex.sets, defaultSet] } : ex,
        ) ?? null,
    })),

  removeSet: (exerciseId: string, setId: string) =>
    set((state) => ({
      exercises:
        state.exercises?.map((ex) =>
          ex.id === exerciseId
            ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) }
            : ex,
        ) ?? null,
    })),

  removeExercise: (exerciseId: string) =>
    set((state) => ({
      exercises: state.exercises?.filter((ex) => ex.id !== exerciseId) ?? null,
    })),

  startRestTimer: (targetTime: number) =>
    set({ restTargetTime: targetTime, isResting: true }),

  stopRestTimer: () => set({ restTargetTime: null, isResting: false }),
}));
