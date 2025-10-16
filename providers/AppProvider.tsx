import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import * as SQLite from 'expo-sqlite';
import initDatabase from '@/database/database';
import { ExerciseService, Exercise } from '@/services/exerciseService';
import { useExerciseStore } from '@/store/exerciseStore';
import { WorkoutService } from '@/services/workoutService';
import exercisesData from '@/assets/data/exercises.json';

interface AppContextType {
  db: SQLite.SQLiteDatabase;
  exerciseService: ExerciseService;
  workoutService: WorkoutService
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// Helper function to validate and transform exercise data
const validateExerciseData = (data: any[]): Exercise[] => {
  return data.map((exercise) => {
    // Validate difficulty field
    const validDifficulties = [
      'Początkujący',
      'Średniozaawansowany',
      'Zaawansowany',
    ];

    const difficulty = validDifficulties.includes(exercise.difficulty)
      ? exercise.difficulty
      : undefined;

    return {
      ...exercise,
      difficulty: difficulty as
        | 'Początkujący'
        | 'Średniozaawansowany'
        | 'Zaawansowany'
        | undefined,
      instructions: exercise.instructions || undefined,
      createdAt: new Date(exercise.createdAt),
    } as Exercise;
  });
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isReady, setIsReady] = useState(false);
  const [context, setContext] = useState<AppContextType | null>(null);
  const initializeService = useExerciseStore(
    (state) => state.initializeService,
  );
  const loadExercises = useExerciseStore((state) => state.loadExercises);
  const loadCategories = useExerciseStore((state) => state.loadCategories);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database
      const database = await initDatabase();

      // Initialize services
      const exerciseService = new ExerciseService(database);
      const workoutService = new WorkoutService(database)

      // Validate and seed exercises
      const validatedExercises = validateExerciseData(exercisesData);
      await exerciseService.seedExercises(validatedExercises);

      // Initialize Zustand store
      initializeService(exerciseService);

      // Load initial data
      await Promise.all([loadExercises(), loadCategories()]);

      setContext({
        db: database,
        exerciseService,
        workoutService
      });

      setIsReady(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  if (!isReady || !context) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' color='#007AFF' />
        <Text style={{ marginTop: 10, fontSize: 16, color: '#666' }}>
          Inicjalizacja aplikacji...
        </Text>
      </View>
    );
  }

  return <AppContext.Provider value={context}>{children}</AppContext.Provider>;
};
