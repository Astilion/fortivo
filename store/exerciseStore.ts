import { create } from 'zustand';
import { Exercise, ExerciseService } from '../services/exerciseService';

interface ExerciseState {
  // State
  exercises: Exercise[];
  categories: string[];
  favoriteExercises: string[];
  loading: boolean;
  error: string | null;
  userId: string; // Add userId to state

  // Service instance
  exerciseService: ExerciseService | null;

  // Actions
  setUserId: (userId: string) => void;
  initializeService: (service: ExerciseService) => void;
  loadExercises: () => Promise<void>;
  loadCategories: () => Promise<void>;
  searchExercises: (query: string) => Promise<void>;
  filterByCategory: (category: string) => Promise<void>;
  createExercise: (
    exercise: Omit<Exercise, 'id' | 'isCustom' | 'createdAt' | 'userId'>,
  ) => Promise<void>;
  updateExercise: (
    id: string,
    updates: Partial<
      Omit<Exercise, 'id' | 'isCustom' | 'createdAt' | 'userId'>
    >,
  ) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  loadFavorites: () => Promise<void>;
  toggleFavorite: (exerciseId: string) => Promise<void>;
  isFavorite: (exerciseId: string) => boolean;
  reset: () => void;
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  // Initial state
  exercises: [],
  categories: [],
  favoriteExercises: [],
  loading: false,
  error: null,
  userId: 'default-user', // Default userId
  exerciseService: null,

  // Set userId
  setUserId: (userId: string) => {
    set({ userId });
  },

  // Initialize service
  initializeService: (service: ExerciseService) => {
    set({ exerciseService: service });
  },

  // Load all exercises
  loadExercises: async () => {
    const { exerciseService, userId } = get();
    if (!exerciseService) return;

    set({ loading: true, error: null });
    try {
      const exercises = await exerciseService.getAllExercises(userId);
      set({ exercises, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to load exercises',
        loading: false,
      });
    }
  },

  // Load categories
  loadCategories: async () => {
    const { exerciseService, userId } = get();
    if (!exerciseService) return;

    try {
      const categories = await exerciseService.getCategories(userId);
      set({ categories });
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  },

  // Search exercises
  searchExercises: async (query: string) => {
    const { exerciseService, userId } = get();
    if (!exerciseService) return;

    set({ loading: true, error: null });
    try {
      if (query.trim() === '') {
        await get().loadExercises();
      } else {
        const exercises = await exerciseService.searchExercises(query, userId);
        set({ exercises, loading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Search failed',
        loading: false,
      });
    }
  },

  // Filter by category
  filterByCategory: async (category: string) => {
    const { exerciseService, userId } = get();
    if (!exerciseService) return;

    set({ loading: true, error: null });
    try {
      if (category === 'all') {
        await get().loadExercises();
      } else {
        const exercises = await exerciseService.getExercisesByCategory(
          category,
          userId,
        );
        set({ exercises, loading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Filter failed',
        loading: false,
      });
    }
  },

  // Create exercise
  createExercise: async (exerciseData) => {
    const { exerciseService, userId } = get();
    if (!exerciseService) throw new Error('Service not initialized');

    set({ loading: true, error: null });
    try {
      // Pass exerciseData first, userId second
      const newExercise = await exerciseService.createExercise(
        exerciseData,
        userId,
      );
      const currentExercises = get().exercises;
      set({
        exercises: [newExercise, ...currentExercises],
        loading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to create exercise',
        loading: false,
      });
      throw error;
    }
  },

  // Update exercise
  updateExercise: async (id, updates) => {
    const { exerciseService, userId } = get();
    if (!exerciseService) throw new Error('Service not initialized');

    set({ loading: true, error: null });
    try {
      // Pass id first, updates second, userId third
      await exerciseService.updateExercise(id, updates, userId);

      // Reload exercises to get updated data
      await get().loadExercises();
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to update exercise',
        loading: false,
      });
      throw error;
    }
  },

  // Delete exercise
  deleteExercise: async (id) => {
    const { exerciseService, userId } = get();
    if (!exerciseService) throw new Error('Service not initialized');

    set({ loading: true, error: null });
    try {
      // Pass id first, userId second
      await exerciseService.deleteExercise(id, userId);
      const currentExercises = get().exercises;
      set({
        exercises: currentExercises.filter((ex) => ex.id !== id),
        loading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to delete exercise',
        loading: false,
      });
      throw error;
    }
  },
  // ==================== FAVORITES ====================

  loadFavorites: async () => {
    const { exerciseService, userId } = get();
    if (!exerciseService) return;

    try {
      const favoriteExercises = await exerciseService.getFavorites(userId);
      set({ favoriteExercises });
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  },

  toggleFavorite: async (exerciseId: string) => {
    const { exerciseService, userId, favoriteExercises } = get();
    if (!exerciseService) return;

    try {
      const isFav = favoriteExercises.includes(exerciseId);

      if (isFav) {
        // Remove from favorites
        await exerciseService.removeFavorite(exerciseId, userId);
        set({
          favoriteExercises: favoriteExercises.filter(
            (id) => id !== exerciseId,
          ),
        });
      } else {
        // Add to favorites
        await exerciseService.addFavorite(exerciseId, userId);
        set({
          favoriteExercises: [...favoriteExercises, exerciseId],
        });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  },

  isFavorite: (exerciseId: string) => {
    const { favoriteExercises } = get();
    return favoriteExercises.includes(exerciseId);
  },
  // Reset state
  reset: () => {
    set({
      exercises: [],
      categories: [],
      favoriteExercises: [],
      loading: false,
      error: null,
    });
  },
}));
