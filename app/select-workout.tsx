import { EmptyState } from '@/components/ui/EmptyState';
import colors from '@/constants/Colors';
import { useApp } from '@/providers/AppProvider';
import { useWeeklyPlanStore } from '@/store/weeklyPlanStore';
import { Workout, WorkoutRow, WorkoutWithCountRow } from '@/types/training';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useToastStore } from '@/store/toastStore';
import { ServiceError } from '@/utils/errors';
import { logger } from '@/utils/logger';

export default function SelectWorkoutScreen() {
  const [workouts, setWorkouts] = useState<WorkoutWithCountRow[]>([]);
  const { workoutService } = useApp();
  const { setPendingWorkout } = useWeeklyPlanStore();
  const router = useRouter();

  const { showToast } = useToastStore();

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const all = await workoutService.getAllWorkouts();
          setWorkouts(all);
        } catch (error) {
          logger.error('Failed to load workouts', error);
          showToast(
            error instanceof ServiceError
              ? error.userMessage
              : 'Nie udało się załadować treningów',
            'error',
          );
        }
      };
      load();
      // Fetch the list on each focus; workoutService is stable from context.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const handleSelect = (workout: WorkoutRow) => {
    setPendingWorkout({ id: workout.id, name: workout.name } as Workout);
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {workouts.length === 0 ? (
          <EmptyState
            icon="barbell-outline"
            title="Brak treningów"
            subtitle="Najpierw stwórz jakiś trening"
          />
        ) : (
          workouts.map((workout) => (
            <Pressable
              key={workout.id}
              style={styles.workoutItem}
              onPress={() => handleSelect(workout)}
            >
              <Text style={styles.workoutName}>{workout.name}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    padding: 20,
  },
  workoutItem: {
    backgroundColor: colors.secondary,
    padding: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  workoutName: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
});
