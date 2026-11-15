import { create } from 'zustand';
import { WorkoutExerciseWithSets, WorkoutSet } from '@/types/training';
import { getFollowingSetUpdates } from '@/utils/activeWorkoutSets';

// In-memory only (NO persist middleware). SQLite is the single source of truth;
// this store is hydrated from the DB on boot and on screen mount, so the active
// workout survives a process kill.
interface ActiveWorkoutState {
  workoutId: string | null;
  workoutStartTime: number | null;
  exercises: WorkoutExerciseWithSets[] | null;
  restTargetTime: number | null;
  isResting: boolean;

  // startTime omitted = fresh start (Date.now()); passed = hydration from DB.
  startActiveWorkout: (workoutId: string, startTime?: number) => void;
  finishActiveWorkout: () => void;
  reset: () => void; // alias to finishActiveWorkout, for the inactivity-timeout cleanup

  setExercises: (exercises: WorkoutExerciseWithSets[]) => void;
  updateSetValue: (
    exerciseId: string,
    setId: string,
    updates: Partial<WorkoutSet>,
  ) => void;
  // Returns the new `completed` value — the screen needs it to decide whether to
  // start the rest timer (which depends on user settings it owns).
  toggleSetCompleted: (exerciseId: string, setId: string) => boolean;
  // Returns how many sets changed, for the confirmation toast.
  applySetToFollowing: (exerciseId: string, sourceSetId: string) => number;
  addExercise: (exercise: WorkoutExerciseWithSets) => void;
  addSet: (exerciseId: string, defaultSet: WorkoutSet) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  removeExercise: (exerciseId: string) => void;

  startRestTimer: (targetTime: number) => void;
  stopRestTimer: () => void;
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>((set, get) => ({
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

  applySetToFollowing: (exerciseId: string, sourceSetId: string) => {
    const exercise = get().exercises?.find((ex) => ex.id === exerciseId);
    if (!exercise) return 0;

    const targets = getFollowingSetUpdates(exercise, sourceSetId);
    // No set() on a no-op: a fresh exercises reference would trigger autosave.
    if (targets.length === 0) return 0;

    const updatesById = new Map(targets.map((t) => [t.setId, t.updates]));
    set((state) => ({
      exercises:
        state.exercises?.map((ex) =>
          ex.id === exerciseId
            ? {
                ...ex,
                sets: ex.sets.map((s) => {
                  const updates = updatesById.get(s.id);
                  return updates ? { ...s, ...updates } : s;
                }),
              }
            : ex,
        ) ?? null,
    }));
    return targets.length;
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
