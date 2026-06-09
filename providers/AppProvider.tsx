import * as Sentry from '@sentry/react-native';
import exercisesData from '@/assets/data/exercises.json';
import { DatabaseMigrationError, initDatabase } from '@/database/database';
import { useDbErrorStore } from '@/store/dbErrorStore';
import { DatabaseRecoveryScreen } from '@/components/DatabaseRecoveryScreen';
import { ErrorView } from '@/components/ui/ErrorView';
import { Exercise, ExerciseService } from '@/services/exerciseService';
import { WorkoutService } from '@/services/workoutService';
import { useExerciseStore } from '@/store/exerciseStore';
import { useWeeklyPlanStore } from '@/store/weeklyPlanStore';
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore';
import { ProfileService } from '@/services/profileService';
import { WeightService } from '@/services/weightService';
import { MeasurementService } from '@/services/measurementService';
import { WeeklyPlanService } from '@/services/weeklyPlanService';
import { PresetService } from '@/services/presetService';
import { validatePresets } from '@/utils/validatePresets';
import { ACTIVE_WORKOUT_TIMEOUT_MS } from '@/constants/activeWorkout';
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
  presetService: PresetService;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

const validateExerciseData = (data: any[]): Exercise[] => {
  return data.map((exercise) => {
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
  const [initError, setInitError] = useState(false);
  const [context, setContext] = useState<AppContextType | null>(null);
  const initializeService = useExerciseStore(
    (state) => state.initializeService,
  );
  const loadExercises = useExerciseStore((state) => state.loadExercises);
  const loadCategories = useExerciseStore((state) => state.loadCategories);
  const loadFavorites = useExerciseStore((state) => state.loadFavorites);
  const setActivePlan = useWeeklyPlanStore((state) => state.setActivePlan);
  const hydrateActiveWorkout = useActiveWorkoutStore(
    (state) => state.startActiveWorkout,
  );
  const dbError = useDbErrorStore((state) => state.dbError);
  const reinitNonce = useDbErrorStore((state) => state.reinitNonce);
  const setDbError = useDbErrorStore((state) => state.setDbError);
  const clearDbError = useDbErrorStore((state) => state.clearDbError);
  const requestReinit = useDbErrorStore((state) => state.requestReinit);

  // Bootstrap on mount; re-run on every recovery attempt (reinitNonce bump).
  useEffect(() => {
    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reinitNonce]);

  const initializeApp = async () => {
    setIsReady(false);
    setInitError(false);
    try {
      const database = await initDatabase();

      const exerciseService = new ExerciseService(database);
      const workoutService = new WorkoutService(database);
      const profileService = new ProfileService(database);
      const weightService = new WeightService(database);
      const measurementService = new MeasurementService(database);
      const weeklyPlanService = new WeeklyPlanService(database);
      const presetService = new PresetService(database);

      const validatedExercises = validateExerciseData(exercisesData);
      await exerciseService.seedExercises(validatedExercises);

      initializeService(exerciseService);

      const [activePlan, activeWorkout] = await Promise.all([
        weeklyPlanService.getActivePlan(),
        workoutService.getActiveWorkout(),
        loadExercises(),
        loadCategories(),
        loadFavorites(),
      ]);
      setActivePlan(activePlan);

      // Hydrate the in-memory active-workout store from the DB so the FAB and
      // duration survive a process kill. Legacy rows (pre-v7) have no
      // started_at — fall back to now, accepting a one-off wrong duration.
      // A session older than the timeout is abandoned: clear it silently
      // (no toast — the user has no context for it at boot).
      if (activeWorkout) {
        const parsed = activeWorkout.started_at
          ? Date.parse(activeWorkout.started_at)
          : NaN;
        const isStale =
          !Number.isNaN(parsed) &&
          Date.now() - parsed > ACTIVE_WORKOUT_TIMEOUT_MS;

        if (isStale) {
          await workoutService.clearStaleActiveWorkout(activeWorkout.id);
        } else {
          hydrateActiveWorkout(
            activeWorkout.id,
            Number.isNaN(parsed) ? Date.now() : parsed,
          );
        }
      }

      setContext({
        db: database,
        exerciseService,
        workoutService,
        profileService,
        weightService,
        measurementService,
        weeklyPlanService,
        presetService,
      });

      validatePresets(exerciseService);

      clearDbError();
      setIsReady(true);
    } catch (error) {
      logger.error('Failed to initialize app:', error);
      // Migration failures get the recovery screen; anything else gets a
      // retryable error state instead of an endless spinner.
      if (error instanceof DatabaseMigrationError) {
        Sentry.captureException(error, {
          tags: {
            migration_version: error.message.match(/v(\d+)/)?.[1] ?? 'unknown',
          },
        });
        setDbError(error);
      } else {
        Sentry.captureException(error);
        setInitError(true);
      }
    }
  };

  // Take over the screen directly (bypassing the router) so the broken
  // (tabs) tree never mounts and crashes on useApp() with no context.
  if (dbError) {
    return <DatabaseRecoveryScreen />;
  }

  if (initError) {
    return (
      <ErrorView
        error="Nie udało się uruchomić aplikacji"
        onRetry={requestReinit}
      />
    );
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
