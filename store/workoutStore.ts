import { create } from 'zustand';
import { Exercise } from '@/types/training';

interface WorkoutDraft {
  name: string;
  exercises: Exercise[];
}

interface WorkoutStore {
  draft: WorkoutDraft;

  setWorkoutName: (name: string) => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (exerciseId: string) => void;
  clearDraft: () => void;
  setExercises: (exercises: Exercise[]) => void;
}

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
        exercises: [...state.draft.exercises, exercise],
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

  setExercises: (exercises: Exercise[]) =>
    set((state) => ({
      draft: { ...state.draft, exercises },
    })),
}));
