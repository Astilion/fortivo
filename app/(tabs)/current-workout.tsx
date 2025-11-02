import { StyleSheet, View, Text, ScrollView } from 'react-native';
import colors from '@/constants/Colors';
import { useApp } from '@/providers/AppProvider';
import { useState, useCallback } from 'react';
import { WorkoutRow } from '@/types/training';
import { WorkoutExerciseWithSets } from '@/store/workoutStore';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
export default function CurrentWorkoutScreen() {
  const { workoutService } = useApp();
  const [activeWorkout, setActiveWorkout] = useState<WorkoutRow | null>(null);
  const [exercises, setExercises] = useState<WorkoutExerciseWithSets[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadActiveWorkout();
    }, []),
  );

  const loadActiveWorkout = async () => {
    const workout = await workoutService.getActiveWorkout();
    setActiveWorkout(workout);

    if (workout) {
      const ex = await workoutService.getWorkoutExercises(workout.id);
      setExercises(ex);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mój plan</Text>
      </View>

      <View style={styles.content}>
        {activeWorkout ? (
          <>
            {/* Workout info card */}
            <View style={styles.workoutCard}>
              <Text style={styles.workoutName}>{activeWorkout.name}</Text>
              <Text style={styles.workoutMeta}>{exercises.length} ćwiczeń</Text>
            </View>

            {/* Exercises list */}
            <ScrollView style={styles.exercisesList}>
              {exercises.map((item, index) => (
                <View key={item.exercise.id} style={styles.exerciseItem}>
                  <Text style={styles.exerciseName}>
                    {index + 1}. {item.exercise.name}
                  </Text>
                  <Text style={styles.exerciseSets}>
                    {item.sets.length} serii
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Start workout button */}
            <View style={styles.actions}>
              <Button
                title='🏋️ Rozpocznij trening'
                variant='primary'
                onPress={() => router.push('/active-workout')}
              />
            </View>
          </>
        ) : (
          // CASE 2: Brak aktywnego treningu
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nie masz aktywnego treningu</Text>

            <View style={styles.emptyActions}>
              <Button
                title='+ Stwórz nowy trening'
                variant='primary'
                onPress={() => router.push('/create-workout')}
              />

              <Button
                title='📋 Wybierz z biblioteki'
                variant='secondary'
                onPress={() => {
                  /* TODO: navigate to workouts + select mode */
                }}
              />
            </View>
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Active workout card
  workoutCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  workoutName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  workoutMeta: {
    fontSize: 14,
    color: colors.text.secondary,
  },

  // Exercises list
  exercisesList: {
    flex: 1,
    marginBottom: 20,
  },
  exerciseItem: {
    backgroundColor: colors.secondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 4,
  },
  exerciseSets: {
    fontSize: 14,
    color: colors.text.secondary,
  },

  // Actions
  actions: {
    paddingBottom: 20,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 30,
    textAlign: 'center',
  },
  emptyActions: {
    width: '100%',
    gap: 12,
  },
});
