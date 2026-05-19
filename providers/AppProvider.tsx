import exercisesData from '@/assets/data/exercises.json';
import { DatabaseMigrationError, initDatabase } from '@/database/database';
import { useDbErrorStore } from '@/store/dbErrorStore';
import { DatabaseRecoveryScreen } from '@/components/DatabaseRecoveryScreen';
import { Exercise, ExerciseService } from '@/services/exerciseService';
import { WorkoutService } from '@/services/workoutService';
import { useExerciseStore } from '@/store/exerciseStore';
import { useWeeklyPlanStore } from '@/store/weeklyPlanStore';
import { ProfileService } from '@/services/profileService';
import { WeightService } from '@/services/weightService';
import { MeasurementService } from '@/services/measurementService';
import { WeeklyPlanService } from '@/services/weeklyPlanService';
import * as SQLite from 'expo-sqlite';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { logger } from '@/utils/logger';
import colors from '@/constants/Colors';

interface AppContextType {
  db: SQLite.SQLiteDatabase;
  exerciseService: ExerciseService;
  workoutService: WorkoutService;
  profileService: ProfileService;
  weightService: WeightService;
  measurementService: MeasurementService;
  weeklyPlanService: WeeklyPlanService;
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
  const loadFavorites = useExerciseStore((state) => state.loadFavorites);
  const setActivePlan = useWeeklyPlanStore((state) => state.setActivePlan);
  const dbError = useDbErrorStore((state) => state.dbError);
  const reinitNonce = useDbErrorStore((state) => state.reinitNonce);
  const setDbError = useDbErrorStore((state) => state.setDbError);
  const clearDbError = useDbErrorStore((state) => state.clearDbError);

  // Bootstrap on mount; re-run on every recovery attempt (reinitNonce bump).
  useEffect(() => {
    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reinitNonce]);

  const initializeApp = async () => {
    setIsReady(false);
    try {
      // Initialize database
      const database = await initDatabase();

      // Initialize services
      const exerciseService = new ExerciseService(database);
      const workoutService = new WorkoutService(database);
      const profileService = new ProfileService(database);
      const weightService = new WeightService(database);
      const measurementService = new MeasurementService(database);
      const weeklyPlanService = new WeeklyPlanService(database);

      // Validate and seed exercises
      const validatedExercises = validateExerciseData(exercisesData);
      await exerciseService.seedExercises(validatedExercises);

      // Initialize Zustand store
      initializeService(exerciseService);

      // Load initial data
      const [activePlan] = await Promise.all([
        weeklyPlanService.getActivePlan(),
        loadExercises(),
        loadCategories(),
        loadFavorites(),
      ]);
      setActivePlan(activePlan);

      setContext({
        db: database,
        exerciseService,
        workoutService,
        profileService,
        weightService,
        measurementService,
        weeklyPlanService,
      });

      clearDbError();
      setIsReady(true);
    } catch (error) {
      logger.error('Failed to initialize app:', error);
      // Migration failures get the recovery screen; other errors stay logged.
      if (error instanceof DatabaseMigrationError) {
        setDbError(error);
      }
    }
  };

  // Take over the screen directly (bypassing the router) so the broken
  // (tabs) tree never mounts and crashes on useApp() with no context.
  if (dbError) {
    return <DatabaseRecoveryScreen />;
  }

  if (!isReady || !context) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Inicjalizacja aplikacji...</Text>
      </View>
    );
  }

  return <AppContext.Provider value={context}>{children}</AppContext.Provider>;
};
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text.secondary,
  },
});
