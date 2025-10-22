import { create } from 'zustand';
import { Exercise, WorkoutSet } from '@/types/training';

interface WorkoutExerciseWithSets {
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

  setWorkoutName: (name: string) =>
    set((state) => ({
      draft: { ...state.draft, name },
    })),

  addExercise: (exercise: Exercise) =>
    set((state) => ({
      draft: {
        ...state.draft,
        exercises: [
          ...state.draft.exercises,
          {
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
        exercises: state.draft.exercises.filter(
          (ex) => ex.exercise.id !== exerciseId,
        ),
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
          ex.exercise.id === exerciseId
            ? { ...ex, isExpanded: !ex.isExpanded }
            : ex,
        ),
      },
    })),

  // Add new set to exercise
  addSet: (exerciseId: string) =>
    set((state) => ({
      draft: {
        ...state.draft,
        exercises: state.draft.exercises.map((ex) => {
          if (ex.exercise.id === exerciseId) {
            const lastSet = ex.sets[ex.sets.length - 1];
            const newSetOrder = ex.sets.length;

            const newSet: WorkoutSet = {
              id: `temp_${Date.now()}_${newSetOrder}_${Math.random()}`,
              reps: lastSet ? lastSet.reps : 8,
              weight: lastSet ? lastSet.weight : 0,
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

  // Remove set from exercise
  removeSet: (exerciseId: string, setId: string) =>
    set((state) => ({
      draft: {
        ...state.draft,
        exercises: state.draft.exercises.map((ex) => {
          if (ex.exercise.id === exerciseId) {
            return {
              ...ex,
              sets: ex.sets.filter((s) => s.id !== setId),
            };
          }
          return ex;
        }),
      },
    })),

  // Update set properties (reps, weight, etc.)
  updateSet: (
    exerciseId: string,
    setId: string,
    updates: Partial<WorkoutSet>,
  ) =>
    set((state) => ({
      draft: {
        ...state.draft,
        exercises: state.draft.exercises.map((ex) => {
          if (ex.exercise.id === exerciseId) {
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
}));
