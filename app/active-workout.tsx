import { Button } from '@/components/ui/Button';
import colors from '@/constants/Colors';
import { useApp } from '@/providers/AppProvider';
import {
  WorkoutExerciseWithSets,
  WorkoutRow,
  WorkoutSet,
} from '@/types/training';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, useEffect, useRef } from 'react';
import { generateId } from '@/database/database';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { parseDecimal, parseInteger } from '@/utils/numbers';
import { useProfileSettings } from '@/hooks/useProfileSettings';
import { validateRPE, validateTempo } from '@/utils/validation';
import { logger } from '@/utils/logger';
import { confirmAction } from '@/utils/confirm';
import { useWorkoutStore } from '@/store/workoutStore';
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore';
import { useActiveWorkoutAutosave } from '@/hooks/useActiveWorkoutAutosave';
import { useToastStore } from '@/store/toastStore';
import { ServiceError } from '@/utils/errors';
import { ACTIVE_WORKOUT_TIMEOUT_MS } from '@/constants/activeWorkout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MeasurementType = 'reps' | 'time' | 'distance';

// Active workout edits each set's *actual* value; field & label depend on the
// exercise's measurementType (reps / seconds / meters).
const getValueLabel = (measurementType?: MeasurementType): string => {
  switch (measurementType) {
    case 'time':
      return 'Czas (s)';
    case 'distance':
      return 'Dyst. (m)';
    default:
      return 'Powt.';
  }
};

const getActualValue = (
  set: WorkoutSet,
  measurementType?: MeasurementType,
): number | undefined => {
  switch (measurementType) {
    case 'time':
      return set.actualDuration;
    case 'distance':
      return set.actualDistance;
    default:
      return set.actualReps;
  }
};

const buildActualUpdate = (
  measurementType: MeasurementType | undefined,
  value: number,
): Partial<WorkoutSet> => {
  switch (measurementType) {
    case 'time':
      return { actualDuration: value };
    case 'distance':
      return { actualDistance: value };
    default:
      return { actualReps: value };
  }
};

export default function ActiveWorkoutScreen() {
  const [workout, setWorkout] = useState<WorkoutRow | null>(null);
  const [validationKey, setValidationKey] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [, setTick] = useState(0);
  const { workoutService } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useProfileSettings();
  const exercises = useActiveWorkoutStore((state) => state.exercises);
  const isResting = useActiveWorkoutStore((state) => state.isResting);
  const restTargetTime = useActiveWorkoutStore((state) => state.restTargetTime);
  const pendingExercise = useWorkoutStore((state) => state.pendingExercise);
  const clearPendingExercise = useWorkoutStore(
    (state) => state.clearPendingExercise,
  );
  const { showToast } = useToastStore();
  const exerciseList = exercises ?? [];

  // Latest raw text per input, stashed via onChangeText (no re-render — inputs
  // stay uncontrolled). onBlur's event carries no text, so commit handlers read
  // from here. Consumed on commit so a no-op blur (user never typed) is skipped.
  const pendingText = useRef<Record<string, string>>({});
  const stashText = (key: string, text: string) => {
    pendingText.current[key] = text;
  };
  const takeText = (key: string): string | undefined => {
    const text = pendingText.current[key];
    delete pendingText.current[key];
    return text;
  };

  useActiveWorkoutAutosave();

  // Load once per mount; loadActiveWorkout reconciles DB against the store
  // (keeps live state on in-app nav, hydrates on cold start).
  useFocusEffect(
    useCallback(() => {
      if (!isLoaded) {
        loadActiveWorkout();
        setIsLoaded(true);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded]),
  );

  useFocusEffect(
    useCallback(() => {
      if (pendingExercise) {
        const newExercise: WorkoutExerciseWithSets = {
          id: generateId('we'),
          exercise: pendingExercise,
          sets: [
            { id: generateId('ws'), reps: 8, weight: 0, completed: false },
          ],
        };
        useActiveWorkoutStore.getState().addExercise(newExercise);
        clearPendingExercise();
      }
      // Mailbox: depend on pendingExercise only (other refs are stable).
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingExercise]),
  );

  // Force-blur on unmount so a value typed but not submitted (no Enter, no
  // tap-out) still fires its onBlur handler into the store before navigation.
  useEffect(() => {
    return () => {
      TextInput.State.currentlyFocusedInput()?.blur();
    };
  }, []);

  useEffect(() => {
    if (!isResting || restTargetTime === null) return;

    const interval = setInterval(() => {
      const remaining = Math.ceil((restTargetTime - Date.now()) / 1000);
      if (remaining <= 0) {
        useActiveWorkoutStore.getState().stopRestTimer();
      } else {
        setTick((prev) => prev + 1);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isResting, restTargetTime]);

  const loadActiveWorkout = async () => {
    const dbWorkout = await workoutService.getActiveWorkout();

    if (!dbWorkout) {
      router.replace('/(tabs)/current-workout');
      return;
    }

    if (dbWorkout.started_at) {
      const startedAt = Date.parse(dbWorkout.started_at);
      if (Date.now() - startedAt > ACTIVE_WORKOUT_TIMEOUT_MS) {
        await workoutService.clearStaleActiveWorkout(dbWorkout.id);
        useActiveWorkoutStore.getState().reset();
        showToast(
          'Poprzedni trening wygasł (po 12h). Możesz zacząć nowy.',
          'info',
        );
        router.replace('/(tabs)/current-workout');
        return;
      }
    }

    setWorkout(dbWorkout);

    // Store already holds live state for this workout (in-app navigation) — keep it.
    const store = useActiveWorkoutStore.getState();
    if (store.workoutId === dbWorkout.id && store.exercises !== null) return;

    // Cold start / kill recovery — hydrate from DB. completed is read as-is;
    // actual_* falls back to planned per field only when NULL (M1.6 prefill).
    const dbExercises = await workoutService.getWorkoutExercises(dbWorkout.id);
    const hydrated = dbExercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((set) => ({
        ...set,
        actualReps: set.actualReps ?? set.reps,
        actualWeight: set.actualWeight ?? set.weight,
        actualRpe: set.actualRpe ?? set.rpe,
        actualDuration: set.actualDuration ?? set.duration,
        actualDistance: set.actualDistance ?? set.distance,
      })),
    }));
    // Bind workoutId + startTime together with exercises so a stale workoutId
    // can never pair with another workout's exercises.
    useActiveWorkoutStore
      .getState()
      .startActiveWorkout(
        dbWorkout.id,
        dbWorkout.started_at ? Date.parse(dbWorkout.started_at) : Date.now(),
      );
    useActiveWorkoutStore.getState().setExercises(hydrated);
  };

  const toggleSetCompleted = (exerciseId: string, setId: string) => {
    const store = useActiveWorkoutStore.getState();
    const nowCompleted = store.toggleSetCompleted(exerciseId, setId);
    if (nowCompleted && settings?.trackRestTime) {
      const set = store.exercises
        ?.find((ex) => ex.id === exerciseId)
        ?.sets.find((s) => s.id === setId);
      const restTime = set?.restTime ?? settings.defaultRestTime ?? 90;
      store.startRestTimer(Date.now() + restTime * 1000);
    }
  };

  const addSet = (exerciseId: string) => {
    const ex = exerciseList.find((e) => e.id === exerciseId);
    if (!ex) return;

    const lastSet = ex.sets[ex.sets.length - 1];
    const measurementType = ex.exercise.measurementType;
    const isTime = measurementType === 'time';
    const isDistance = measurementType === 'distance';

    const newSet: WorkoutSet = {
      id: generateId('ws'),
      // reps is required (NOT NULL); kept as a placeholder for time/distance sets.
      reps: lastSet?.actualReps || lastSet?.reps || 10,
      weight: lastSet?.actualWeight || lastSet?.weight || 0,
      rpe: lastSet?.actualRpe || lastSet?.rpe || undefined,
      tempo: lastSet?.tempo || undefined,
      restTime: lastSet?.restTime || undefined,
      completed: false,
      notes: undefined,
      actualReps:
        isTime || isDistance
          ? undefined
          : lastSet?.actualReps || lastSet?.reps || 8,
      actualWeight: lastSet?.actualWeight || lastSet?.weight || 0,
      actualRpe: lastSet?.actualRpe || undefined,
      duration: lastSet?.duration || undefined,
      actualDuration: isTime
        ? lastSet?.actualDuration || lastSet?.duration || undefined
        : undefined,
      distance: lastSet?.distance || undefined,
      actualDistance: isDistance
        ? lastSet?.actualDistance || lastSet?.distance || undefined
        : undefined,
    };

    useActiveWorkoutStore.getState().addSet(exerciseId, newSet);
  };

  const removeSet = (exerciseId: string, setId: string) => {
    const ex = exerciseList.find((e) => e.id === exerciseId);
    if (!ex || ex.sets.length <= 1) return;

    confirmAction('Usuń serię', 'Czy na pewno chcesz usunąć tę serię?', () =>
      useActiveWorkoutStore.getState().removeSet(exerciseId, setId),
    );
  };

  const updateSetValue = (
    exerciseId: string,
    setId: string,
    updates: Partial<WorkoutSet>,
  ) => {
    useActiveWorkoutStore.getState().updateSetValue(exerciseId, setId, updates);
  };

  const handleFinishWorkout = () => {
    confirmAction(
      'Zakończ trening',
      'Czy na pewno chcesz zakończyć trening?',
      async () => {
        const { workoutId, workoutStartTime, exercises } =
          useActiveWorkoutStore.getState();
        if (!workoutId || workoutStartTime === null || !exercises) return;

        const durationMinutes = Math.max(
          0,
          Math.round((Date.now() - workoutStartTime) / 60000),
        );

        try {
          await workoutService.saveActiveWorkoutSnapshot(workoutId, exercises);
          await workoutService.saveWorkoutHistory(
            workoutId,
            workout?.name ?? null,
            durationMinutes,
            exercises,
          );
          await workoutService.saveExerciseProgress(
            workoutId,
            exercises,
            workout?.name ?? null,
          );

          await workoutService.clearActiveWorkout(workoutId);
          useActiveWorkoutStore.getState().finishActiveWorkout();
          showToast('Trening zakończony!', 'success');
          router.replace('/(tabs)/workout-history');
        } catch (error) {
          logger.error('Błąd zakończenia treningu', error);
          if (error instanceof ServiceError) {
            showToast(error.userMessage, 'error');
          } else {
            showToast('Nie udało się zapisać treningu', 'error');
          }
        }
      },
      'Zakończ',
    );
  };

  const removeExercise = (exerciseId: string, exerciseName: string) => {
    if (exerciseList.length <= 1) {
      showToast('Nie możesz usunąć ostatniego ćwiczenia', 'info');
      return;
    }
    confirmAction(
      'Usuń ćwiczenie',
      `Czy na pewno chcesz usunąć "${exerciseName}" z treningu?`,
      () => useActiveWorkoutStore.getState().removeExercise(exerciseId),
    );
  };

  const totalSets = exerciseList.reduce((sum, ex) => sum + ex.sets.length, 0);

  const completedSets = exerciseList.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0,
  );

  const progressPercent =
    totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const restTimeRemaining = restTargetTime
    ? Math.max(0, Math.ceil((restTargetTime - Date.now()) / 1000))
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{workout?.name || 'Trening'}</Text>
      </View>
      {isResting && restTargetTime !== null && (
        <View style={styles.restBanner}>
          <Ionicons name="timer-outline" size={18} color={colors.primary} />
          <Text style={styles.restBannerText}>
            Odpoczynek: {restTimeRemaining}s
          </Text>
          <Pressable
            onPress={() => useActiveWorkoutStore.getState().stopRestTimer()}
          >
            <Ionicons name="close" size={18} color={colors.primary} />
          </Pressable>
        </View>
      )}

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progressPercent}%` }]}
          />
        </View>

        <Text style={styles.progressText}>
          {completedSets}/{totalSets} ({progressPercent}%)
        </Text>
      </View>

      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 22 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        {exerciseList.map((item, exIndex) => (
          <View key={item.id} style={styles.exerciseBlock}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>
                {exIndex + 1}. {item.exercise.name}
              </Text>
              <Pressable
                onPress={() => removeExercise(item.id, item.exercise.name)}
                style={styles.removeExerciseButton}
                hitSlop={6}
                accessibilityLabel="Usuń ćwiczenie"
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={colors.danger}
                />
              </Pressable>
            </View>

            {item.sets.map((set, setIndex) => {
              const weightKey = `weight-${set.id}`;
              const valueKey = `value-${set.id}`;
              const rpeKey = `rpe-${set.id}`;
              const tempoKey = `tempo-${set.id}`;

              const commitWeight = () => {
                const text = takeText(weightKey);
                if (text === undefined) return;
                updateSetValue(item.id, set.id, {
                  actualWeight: parseDecimal(text),
                });
              };
              const commitValue = () => {
                const text = takeText(valueKey);
                if (text === undefined) return;
                const val =
                  item.exercise.measurementType === 'distance'
                    ? parseDecimal(text)
                    : parseInteger(text);
                updateSetValue(
                  item.id,
                  set.id,
                  buildActualUpdate(item.exercise.measurementType, val),
                );
              };
              const commitRpe = () => {
                const text = takeText(rpeKey);
                if (text === undefined) return;
                const validated = validateRPE(text);
                if (validated === null && text.trim()) {
                  setValidationKey((prev) => prev + 1);
                }
                updateSetValue(item.id, set.id, {
                  actualRpe: validated ?? undefined,
                });
              };
              const commitTempo = () => {
                const text = takeText(tempoKey);
                if (text === undefined) return;
                const validated = validateTempo(text);
                if (validated === null && text.trim()) {
                  setValidationKey((prev) => prev + 1);
                }
                updateSetValue(item.id, set.id, {
                  tempo: validated ?? undefined,
                });
              };

              return (
                <View key={set.id} style={styles.setCard}>
                  <View style={styles.setHeader}>
                    <Text style={styles.setNumber}>Seria {setIndex + 1}</Text>

                    <View style={styles.setActions}>
                      {item.sets.length > 1 && (
                        <Pressable
                          onPress={() => removeSet(item.id, set.id)}
                          style={styles.deleteButton}
                          hitSlop={6}
                          accessibilityLabel="Usuń serię"
                        >
                          <Ionicons
                            name="close-circle"
                            size={24}
                            color={colors.danger}
                          />
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => toggleSetCompleted(item.id, set.id)}
                        style={styles.checkboxButton}
                      >
                        <Ionicons
                          name={
                            set.completed
                              ? 'checkmark-circle'
                              : 'ellipse-outline'
                          }
                          size={28}
                          color={
                            set.completed
                              ? colors.accent
                              : colors.text.secondary
                          }
                        />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.inputsRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        {`Ciężar (${settings?.preferredWeightUnit ?? 'kg'})`}
                      </Text>
                      <TextInput
                        key={`weight-${set.id}-${set.actualWeight}`}
                        style={styles.input}
                        defaultValue={set.actualWeight?.toString() || '0'}
                        onChangeText={(t) => stashText(weightKey, t)}
                        onEndEditing={commitWeight}
                        onBlur={commitWeight}
                        keyboardType="decimal-pad"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        {getValueLabel(item.exercise.measurementType)}
                      </Text>
                      <TextInput
                        key={`value-${set.id}-${getActualValue(
                          set,
                          item.exercise.measurementType,
                        )}`}
                        style={styles.input}
                        defaultValue={
                          getActualValue(
                            set,
                            item.exercise.measurementType,
                          )?.toString() || '0'
                        }
                        onChangeText={(t) => stashText(valueKey, t)}
                        onEndEditing={commitValue}
                        onBlur={commitValue}
                        keyboardType={
                          item.exercise.measurementType === 'distance'
                            ? 'decimal-pad'
                            : 'numeric'
                        }
                      />
                    </View>
                    {settings?.trackRPE && (
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>RPE</Text>
                        <TextInput
                          key={`rpe-${set.id}-${set.actualRpe}-${validationKey}`}
                          style={styles.input}
                          defaultValue={set.actualRpe?.toString() || ''}
                          onChangeText={(t) => stashText(rpeKey, t)}
                          onEndEditing={commitRpe}
                          onBlur={commitRpe}
                          keyboardType="decimal-pad"
                          placeholder="1-10"
                          placeholderTextColor={colors.muted}
                        />
                      </View>
                    )}
                    {settings?.trackTempo && (
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Tempo</Text>
                        <TextInput
                          key={`tempo-${set.id}-${set.tempo}-${validationKey}`}
                          style={styles.input}
                          defaultValue={set.tempo || ''}
                          onChangeText={(t) => stashText(tempoKey, t)}
                          onEndEditing={commitTempo}
                          onBlur={commitTempo}
                          placeholder="3-1-2"
                          placeholderTextColor={colors.muted}
                        />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
            <Pressable
              style={styles.addSetButton}
              onPress={() => addSet(item.id)}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={colors.accent}
              />
              <Text style={styles.addSetText}>Dodaj serię</Text>
            </Pressable>
          </View>
        ))}
        <Button
          title="Dodaj ćwiczenie"
          variant="primary"
          onPress={() => router.push('/select-exercise?source=active-workout')}
        />
      </KeyboardAwareScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Button
          title="Zakończ trening"
          variant="primary"
          onPress={handleFinishWorkout}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },

  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: colors.secondary,
    marginVertical: 4,
    marginHorizontal: 20,
    borderRadius: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    fontWeight: '600',
  },

  content: {
    flex: 1,
    padding: 20,
  },
  exerciseBlock: {
    marginBottom: 24,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
    flex: 1,
  },
  setCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  setActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 4,
  },
  checkboxButton: {
    padding: 4,
  },
  inputsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  inputGroup: {
    minWidth: 60,
    flexGrow: 1,
    flexBasis: '20%',
  },
  inputLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 6,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 6,
    fontSize: 14,
    color: colors.text.primary,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: colors.primary,
    borderTopWidth: 2,
    borderTopColor: colors.secondary,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  addSetText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  restBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  restBannerText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  addExerciseText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  removeExerciseButton: {
    padding: 6,
    flexShrink: 0,
  },
});
