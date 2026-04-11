import { Exercise, WorkoutSet } from '@/types/training';
import { create } from 'zustand';
import { generateId } from '@/database/database';

export interface WorkoutExerciseWithSets {
  id: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  isExpanded?: boolean;
}

interface WorkoutDraft {
  name: string;
  exercises: WorkoutExerciseWithSets[];
}

interface WorkoutStore {
  draft: WorkoutDraft;
  activeWorkoutId: string | null;
  workoutStartTime: number | null;
  pendingExercise: Exercise | null;

  setWorkoutName: (name: string) => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (exerciseId: string) => void;
  clearDraft: () => void;
  setExercises: (exercises: WorkoutExerciseWithSets[]) => void;
  toggleExpanded: (exerciseId: string) => void;

  // Set management
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  updateSet: (
    exerciseId: string,
    setId: string,
    updates: Partial<WorkoutSet>,
  ) => void;

  moveExerciseUp: (exerciseId: string) => void;
  moveExerciseDown: (exerciseId: string) => void;
  startActiveWorkout: (workoutId: string) => void;
  finishActiveWorkout: () => void;
  setPendingExercise: (exercise: Exercise | null) => void;
  clearPendingExercise: () => void;
}

const createDefaultSet = (order: number): WorkoutSet => ({
  id: `temp_${Date.now()}_${order}_${Math.random()}`,
  reps: 8,
  weight: 0,
  completed: false,
});

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  draft: {
    name: '',
    exercises: [],
  },
  activeWorkoutId: null,
  workoutStartTime: null,
  pendingExercise: null,
  setWorkoutName: (name: string) =>
    set((state) => ({
      draft: { ...state.draft, name },
    })),

  addExercise: (exercise: Exercise) =>
    set((state) => ({
      draft: {
        ...state.draft,
        exercises: [
          ...state.draft.exercises.map((ex) => ({ ...ex, isExpanded: false })),
          {
            id: generateId('we'),
            exercise,
            sets: [createDefaultSet(0)],
            isExpanded: false,
          },
        ],
      },
    })),
  removeExercise: (exerciseId: string) =>
    set((state) => ({
      draft: {
        ...state.draft,
        exercises: state.draft.exercises.filter((ex) => ex.id !== exerciseId),
      },
    })),

  clearDraft: () =>
    set({
      draft: { name: '', exercises: [] },
    }),

  setExercises: (exercises: WorkoutExerciseWithSets[]) =>
    set((state) => ({
      draft: { ...state.draft, exercises },
    })),

  toggleExpanded: (exerciseId: string) =>
    set((state) => ({
      draft: {
        ...state.draft,
        exercises: state.draft.exercises.map((ex) =>
          ex.id === exerciseId
            ? { ...ex, isExpanded: !ex.isExpanded }
            : { ...ex, isExpanded: false },
        ),
      },
    })),

  addSet: (exerciseId: string) =>
    set((state) => ({
      draft: {
        ...state.draft,
        exercises: state.draft.exercises.map((ex) => {
          if (ex.id === exerciseId) {
            const lastSet = ex.sets[ex.sets.length - 1];
            const newSetOrder = ex.sets.length;

            const newSet: WorkoutSet = {
              id: `temp_${Date.now()}_${newSetOrder}_${Math.random()}`,
              reps: lastSet ? lastSet.reps : 8,
              weight: lastSet ? lastSet.weight : 0,
              restTime: lastSet ? lastSet.restTime : undefined,
              completed: false,
            };

            return {
              ...ex,
              sets: [...ex.sets, newSet],
            };
          }
          return ex;
        }),
      },
    })),

  removeSet: (exerciseId: string, setId: string) =>
    set((state) => ({
      draft: {
        ...state.draft,
        exercises: state.draft.exercises.map((ex) => {
          if (ex.id === exerciseId) {
            return {
              ...ex,
              sets: ex.sets.filter((s) => s.id !== setId),
            };
          }
          return ex;
        }),
      },
    })),

  updateSet: (
    exerciseId: string,
    setId: string,
    updates: Partial<WorkoutSet>,
  ) =>
    set((state) => ({
      draft: {
        ...state.draft,
        exercises: state.draft.exercises.map((ex) => {
          if (ex.id === exerciseId) {
            return {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id === setId ? { ...s, ...updates } : s,
              ),
            };
          }
          return ex;
        }),
      },
    })),

  moveExerciseUp: (exerciseId: string) =>
    set((state) => {
      const currentIndex = state.draft.exercises.findIndex(
        (ex) => ex.id === exerciseId,
      );

      // If already first, do nothing
      if (currentIndex <= 0) return state;

      const newExercises = [...state.draft.exercises];
      const [item] = newExercises.splice(currentIndex, 1); // Remove from current position
      newExercises.splice(currentIndex - 1, 0, item); // Insert one position up

      return {
        draft: { ...state.draft, exercises: newExercises },
      };
    }),

  moveExerciseDown: (exerciseId: string) =>
    set((state) => {
      const currentIndex = state.draft.exercises.findIndex(
        (ex) => ex.id === exerciseId,
      );

      // If already last, do nothing
      if (
        currentIndex === -1 ||
        currentIndex >= state.draft.exercises.length - 1
      ) {
        return state;
      }

      const newExercises = [...state.draft.exercises];
      const [item] = newExercises.splice(currentIndex, 1); // Remove from current position
      newExercises.splice(currentIndex + 1, 0, item); // Insert one position down

      return {
        draft: { ...state.draft, exercises: newExercises },
      };
    }),
  startActiveWorkout: (workoutId: string) =>
    set({ activeWorkoutId: workoutId, workoutStartTime: Date.now() }),

  finishActiveWorkout: () =>
    set({ activeWorkoutId: null, workoutStartTime: null }),

  setPendingExercise: (exercise: Exercise | null) =>
    set({ pendingExercise: exercise }),
  clearPendingExercise: () => set({ pendingExercise: null }),
}));
