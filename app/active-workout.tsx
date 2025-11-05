import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApp } from '@/providers/AppProvider';
import { WorkoutRow } from '@/types/training';
import colors from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { WorkoutExerciseWithSets } from '@/store/workoutStore';
import { Ionicons } from '@expo/vector-icons';

export default function ActiveWorkoutScreen() {
  const { workoutService } = useApp();
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutRow | null>(null);
  const [exercises, setExercises] = useState<WorkoutExerciseWithSets[]>([]);
  const [startTime] = useState<Date>(new Date());

  useFocusEffect(
    useCallback(() => {
      loadActiveWorkout();
    }, []),
  );

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
      sets: item.sets.map((set) => ({
        ...set,
        actualReps: set.actualReps ?? set.reps,
        actualWeight: set.actualWeight ?? set.weight,
      })),
    }));

    setExercises(exercisesWithDefaults);
  };

  const toggleSetCompleted = (exerciseId: string, setId: string) => {
    setExercises((prevExercises) => {
      const newExercises = prevExercises.map((ex) => {
        if (ex.exercise.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.id === setId) {
                return {
                  ...s,
                  completed: !s.completed,
                };
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

  const updateActualValue = (
    exerciseId: string,
    setId: string,
    field: 'actualReps' | 'actualWeight',
    value: number,
  ) => {
    setExercises((prevExercises) => {
      const newExercises = prevExercises.map((ex) => {
        if (ex.exercise.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.id === setId) {
                return {
                  ...s,
                  [field]: value,
                };
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

  const handleFinishWorkout = async () => {
    if (!workout) return;

    try {
      const endTime = new Date();
      const durationMinutes = Math.round(
        (endTime.getTime() - startTime.getTime()) / 60000,
      );
      await workoutService.saveActualValues(workout.id, exercises);
      await workoutService.saveWorkoutHistory(workout.id, durationMinutes);
      await workoutService.clearActiveWorkout();

      router.push('/(tabs)/workouts');

      alert('Trening zakończony!');
    } catch (error) {
      console.error('Błąd zakończenia treningu', error);
      alert('Nie udało się zapisać treningu');
    }
  };

  // ====== PROGRESS CALCULATION ======
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  const completedSets = exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0,
  );

  const progressPercent =
    totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{workout?.name || 'Trening'}</Text>
      </View>

      {/* ====== PROGRESS BAR ====== */}
      <View style={styles.progressContainer}>
        {/* Progress bar track (background) */}
        <View style={styles.progressBar}>
          {/* Progress bar fill (dynamic width based on %) */}
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercent}%` }, // Dynamic width!
            ]}
          />
        </View>

        {/* Progress text: "5/15 (33%)" */}
        <Text style={styles.progressText}>
          {completedSets}/{totalSets} ({progressPercent}%)
        </Text>
      </View>

      {/* Exercises List */}
      <ScrollView style={styles.content}>
        {exercises.map((item, exIndex) => (
          <View key={item.exercise.id} style={styles.exerciseBlock}>
            {/* Exercise name */}
            <Text style={styles.exerciseName}>
              {exIndex + 1}. {item.exercise.name}
            </Text>

            {/* Sets */}
            {item.sets.map((set, setIndex) => (
              <View key={set.id} style={styles.setCard}>
                {/* Set header: number + checkbox */}
                <View style={styles.setHeader}>
                  <Text style={styles.setNumber}>Seria {setIndex + 1}</Text>

                  <Pressable
                    onPress={() => toggleSetCompleted(item.exercise.id, set.id)}
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

                {/* Inputs row */}
                <View style={styles.inputsRow}>
                  {/* Weight */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Ciężar (kg)</Text>
                    <TextInput
                      style={styles.input}
                      value={set.actualWeight?.toString() || '0'}
                      onChangeText={(text) => {
                        const val = parseFloat(text) || 0;
                        updateActualValue(
                          item.exercise.id,
                          set.id,
                          'actualWeight',
                          val,
                        );
                      }}
                      keyboardType='numeric'
                    />
                  </View>

                  {/* Reps */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Powtórzenia</Text>
                    <TextInput
                      style={styles.input}
                      value={set.actualReps?.toString() || '0'}
                      onChangeText={(text) => {
                        const val = parseInt(text) || 0;
                        updateActualValue(
                          item.exercise.id,
                          set.id,
                          'actualReps',
                          val,
                        );
                      }}
                      keyboardType='numeric'
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
      {/* Footer with Finish button */}
      <View style={styles.footer}>
        <Button title='Zakończ trening' variant='primary' onPress={handleFinishWorkout}/>
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

  // ====== PROGRESS BAR STYLES ======
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
  checkboxButton: {
    padding: 4,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 6,
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
});
