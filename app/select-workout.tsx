import { EmptyState } from '@/components/ui/EmptyState';
import colors from '@/constants/Colors';
import { useApp } from '@/providers/AppProvider';
import { useWeeklyPlanStore } from '@/store/weeklyPlanStore';
import { Workout, WorkoutRow, WorkoutWithCountRow } from '@/types/training';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SelectWorkoutScreen() {
  const { workoutService } = useApp();
  const { setPendingWorkout } = useWeeklyPlanStore();
  const [workouts, setWorkouts] = useState<WorkoutWithCountRow[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const all = await workoutService.getAllWorkouts();
        setWorkouts(all);
      };
      load();
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
            icon='barbell-outline'
            title='Brak treningów'
            subtitle='Najpierw stwórz jakiś trening'
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
