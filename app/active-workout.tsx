import { Button } from '@/components/ui/Button';
import colors from '@/constants/Colors';
import { useApp } from '@/providers/AppProvider';
import { WorkoutExerciseWithSets } from '@/types/training';
import { WorkoutRow, WorkoutSet } from '@/types/training';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, useEffect, useRef } from 'react';
import { generateId } from '@/database/database';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { parseDecimal, parseInteger } from '@/utils/numbers';
import { useProfileSettings } from '@/hooks/useProfileSettings';
import { validateRPE, validateTempo } from '@/utils/validation';
import { logger } from '@/utils/logger';
import { useWorkoutStore } from '@/store/workoutStore';

export default function ActiveWorkoutScreen() {
  const { workoutService } = useApp();
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutRow | null>(null);
  const [exercises, setExercises] = useState<WorkoutExerciseWithSets[]>([]);
  const [restTargetTime, setRestTargetTime] = useState<number | null>(null);
  const [validationKey, setValidationKey] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const { settings } = useProfileSettings();
  const [isLoaded, setIsLoaded] = useState(false);
  const [tick, setTick] = useState(0);
  const workoutStartTime = useWorkoutStore((state) => state.workoutStartTime);
  const startActiveWorkout = useWorkoutStore(
    (state) => state.startActiveWorkout,
  );
  const finishActiveWorkout = useWorkoutStore(
    (state) => state.finishActiveWorkout,
  );
  const pendingExercise = useWorkoutStore((state) => state.pendingExercise);
  const clearPendingExercise = useWorkoutStore(
    (state) => state.clearPendingExercise,
  );

  useFocusEffect(
    useCallback(() => {
      if (!isLoaded) {
        loadActiveWorkout();
        setIsLoaded(true);
      }
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
        setExercises((prev) => [...prev, newExercise]);
        clearPendingExercise();
      }
    }, [pendingExercise]),
  );

  const exercisesRef = useRef<WorkoutExerciseWithSets[]>([]);
  useEffect(() => {
    if (!isResting || restTargetTime === null) return;

    const interval = setInterval(() => {
      const remaining = Math.ceil((restTargetTime - Date.now()) / 1000);
      if (remaining <= 0) {
        setIsResting(false);
        setRestTargetTime(null);
      } else {
        setTick((prev) => prev + 1);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isResting, restTargetTime]);
  useEffect(() => {
    exercisesRef.current = exercises;
  }, [exercises]);

  const loadActiveWorkout = async () => {
    const workout = await workoutService.getActiveWorkout();

    if (!workout) {
      router.back();
      return;
    }
    setWorkout(workout);
    const ex = await workoutService.getWorkoutExercises(workout.id);

    const exercisesWithDefaults = ex.map((item) => ({
      ...item,
      id: generateId('we'),
      sets: item.sets.map((set) => ({
        ...set,
        completed: false,
        actualReps: set.actualReps ?? set.reps,
        actualWeight: set.actualWeight ?? set.weight,
      })),
    }));
    if (workoutStartTime === null) {
      startActiveWorkout(workout.id);
    }
    setExercises(exercisesWithDefaults);
  };

  const toggleSetCompleted = (exerciseId: string, setId: string) => {
    setExercises((prevExercises) => {
      const newExercises = prevExercises.map((ex) => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.id === setId) {
                const nowCompleted = !s.completed;
                if (nowCompleted && settings?.trackRestTime) {
                  const restTime = s.restTime ?? settings.defaultRestTime ?? 90;
                  setRestTargetTime(Date.now() + restTime * 1000);
                  setIsResting(true);
                }
                return { ...s, completed: nowCompleted };
              }
              return s;
            }),
          };
        }
        return ex;
      });
      return newExercises;
    });
  };
  const addSet = (exerciseId: string) => {
    setExercises((prevExercises) => {
      return prevExercises.map((ex) => {
        if (ex.id === exerciseId) {
          const lastSet = ex.sets[ex.sets.length - 1];

          const newSet: WorkoutSet = {
            id: generateId('ws'),
            reps: lastSet?.actualReps || lastSet?.reps || 10,
            weight: lastSet?.actualWeight || lastSet?.weight || 0,
            rpe: lastSet?.actualRpe || lastSet?.rpe || undefined,
            tempo: lastSet?.tempo || undefined,
            restTime: lastSet?.restTime || undefined,
            completed: false,
            notes: undefined,
            actualReps: lastSet?.actualReps || lastSet?.reps || 8,
            actualWeight: lastSet?.actualWeight || lastSet?.weight || 0,
            actualRpe: lastSet?.actualRpe || undefined,
            duration: undefined,
            actualDuration: undefined,
            distance: undefined,
            actualDistance: undefined,
          };

          return {
            ...ex,
            sets: [...ex.sets, newSet],
          };
        }
        return ex;
      });
    });
  };
  const removeSet = (exerciseId: string, setId: string) => {
    setExercises((prevExercises) => {
      return prevExercises.map((ex) => {
        if (ex.id === exerciseId) {
          if (ex.sets.length <= 1) {
            Alert.alert('Uwaga', 'Nie możesz usunąć ostatniej serii');
            return ex;
          }

          return {
            ...ex,
            sets: ex.sets.filter((s) => s.id !== setId),
          };
        }
        return ex;
      });
    });
  };

  const updateSetValue = (
    exerciseId: string,
    setId: string,
    updates: Partial<WorkoutSet>,
  ) => {
    setExercises((prevExercises) => {
      return prevExercises.map((ex) => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.id === setId) {
                return { ...s, ...updates };
              }
              return s;
            }),
          };
        }
        return ex;
      });
    });
  };
  const handleFinishWorkout = () => {
    Alert.alert('Zakończ trening', 'Czy na pewno chcesz zakończyć trening?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Zakończ',
        style: 'destructive',
        onPress: async () => {
          if (!workout || workoutStartTime === null) return;

          const endTime = Date.now();
          const durationMinutes = Math.max(
            0,
            Math.round((endTime - workoutStartTime) / 60000),
          );

          try {
            await workoutService.saveWorkoutExercises(
              workout.id,
              exercisesRef.current,
            );

            await workoutService.saveWorkoutHistory(
              workout.id,
              durationMinutes,
            );

            await workoutService.saveExerciseProgress(
              workout.id,
              exercisesRef.current,
            );

            Alert.alert('Sukces', 'Trening został zapisany');
            await workoutService.clearActiveWorkout();
            finishActiveWorkout();

            router.replace('/(tabs)/workout-history');
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            logger.error('Błąd zakończenia treningu', error);
            Alert.alert('Błąd', `Nie udało się zapisać treningu:\n${message}`);
          }
        },
      },
    ]);
  };

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  const completedSets = exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0,
  );

  const progressPercent =
    totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const restTimeRemaining = restTargetTime
    ? Math.max(0, Math.ceil((restTargetTime - Date.now()) / 1000))
    : null;

  const removeExercise = (exerciseId: string, exerciseName: string) => {
    if (exercises.length <= 1) {
      Alert.alert('Uwaga', 'Nie możesz usunąć ostatniego ćwiczenia');
      return;
    }
    Alert.alert(
      'Usuń ćwiczenie',
      `Czy na pewno chcesz usunąć "${exerciseName}" z treningu?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () =>
            setExercises((prev) => prev.filter((ex) => ex.id !== exerciseId)),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{workout?.name || 'Trening'}</Text>
      </View>
      {isResting && restTargetTime !== null && (
        <View style={styles.restBanner}>
          <Ionicons name='timer-outline' size={18} color={colors.primary} />
          <Text style={styles.restBannerText}>
            Odpoczynek: {restTimeRemaining}s
          </Text>
          <Pressable
            onPress={() => {
              setIsResting(false);
              setRestTargetTime(null);
            }}
          >
            <Ionicons name='close' size={18} color={colors.primary} />
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 22 }}
      >
        {exercises.map((item, exIndex) => (
          <View key={item.id} style={styles.exerciseBlock}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>
                {exIndex + 1}. {item.exercise.name}
              </Text>
              <Pressable
                onPress={() => removeExercise(item.id, item.exercise.name)}
                style={styles.removeExerciseButton}
              >
                <Ionicons
                  name='trash-outline'
                  size={20}
                  color={colors.danger}
                />
              </Pressable>
            </View>

            {item.sets.map((set, setIndex) => (
              <View key={set.id} style={styles.setCard}>
                <View style={styles.setHeader}>
                  <Text style={styles.setNumber}>Seria {setIndex + 1}</Text>

                  <View style={styles.setActions}>
                    {item.sets.length > 1 && (
                      <Pressable
                        onPress={() => removeSet(item.id, set.id)}
                        style={styles.deleteButton}
                      >
                        <Ionicons
                          name='close-circle'
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
                          set.completed ? 'checkmark-circle' : 'ellipse-outline'
                        }
                        size={28}
                        color={
                          set.completed ? colors.accent : colors.text.secondary
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
                      onEndEditing={(e) => {
                        const val = parseDecimal(e.nativeEvent.text);
                        updateSetValue(item.id, set.id, {
                          actualWeight: val,
                        });
                      }}
                      keyboardType='decimal-pad'
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Powt.</Text>
                    <TextInput
                      key={`reps-${set.id}-${set.actualReps}`}
                      style={styles.input}
                      defaultValue={set.actualReps?.toString() || '0'}
                      onEndEditing={(e) => {
                        const val = parseInteger(e.nativeEvent.text);
                        updateSetValue(item.id, set.id, {
                          actualReps: val,
                        });
                      }}
                      keyboardType='numeric'
                    />
                  </View>
                  {settings?.trackRPE && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>RPE</Text>
                      <TextInput
                        key={`rpe-${set.id}-${set.actualRpe}-${validationKey}`}
                        style={styles.input}
                        defaultValue={set.actualRpe?.toString() || ''}
                        onEndEditing={(e) => {
                          const validated = validateRPE(e.nativeEvent.text);
                          if (validated === null && e.nativeEvent.text.trim()) {
                            setValidationKey((prev) => prev + 1);
                          }
                          updateSetValue(item.id, set.id, {
                            actualRpe: validated ?? undefined,
                          });
                        }}
                        keyboardType='decimal-pad'
                        placeholder='1-10'
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
                        onEndEditing={(e) => {
                          const validated = validateTempo(e.nativeEvent.text);
                          if (validated === null && e.nativeEvent.text.trim()) {
                            setValidationKey((prev) => prev + 1);
                          }
                          updateSetValue(item.id, set.id, {
                            tempo: validated ?? undefined,
                          });
                        }}
                        placeholder='3-1-2'
                        placeholderTextColor={colors.muted}
                      />
                    </View>
                  )}
                </View>
              </View>
            ))}
            <Pressable
              style={styles.addSetButton}
              onPress={() => addSet(item.id)}
            >
              <Ionicons
                name='add-circle-outline'
                size={20}
                color={colors.accent}
              />
              <Text style={styles.addSetText}>Dodaj serię</Text>
            </Pressable>
          </View>
        ))}
        <Button
          title='Dodaj ćwiczenie'
          variant='primary'
          onPress={() => router.push('/select-exercise?source=active-workout')}
        />
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title='Zakończ trening'
          variant='primary'
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
    paddingBottom: 40,
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
