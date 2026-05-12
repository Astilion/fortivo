import { Button } from '@/components/ui/Button';
import { LoadingView } from '@/components/ui/LoadingView';
import colors from '@/constants/Colors';
import { useWeeklyPlanData } from '@/hooks/useWeeklyPlanData';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useApp } from '@/providers/AppProvider';
import { WorkoutRow, WorkoutExerciseWithSets } from '@/types/training';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function CurrentWorkoutScreen() {
  const { workoutService } = useApp();
  const { activePlan, planDays, selectedDay, setSelectedDay, loading: planLoading } =
    useWeeklyPlanData();
  const today = new Date().getDay();
  const [activeWorkout, setActiveWorkout] = useState<WorkoutRow | null>(null);
  const [exercises, setExercises] = useState<WorkoutExerciseWithSets[]>([]);
  const [workoutsCount, setWorkoutsCount] = useState(0);
  const [workoutLoading, setWorkoutLoading] = useState(true);
  const router = useRouter();

  const loadActiveWorkout = useCallback(async () => {
    const workout = await workoutService.getActiveWorkout();
    setActiveWorkout(workout);
    const count = await workoutService.countWorkouts();
    setWorkoutsCount(count);
    if (workout) {
      const ex = await workoutService.getWorkoutExercises(workout.id);
      setExercises(ex);
    }
  }, [workoutService]);

  const refreshWorkout = useCallback(async () => {
    setWorkoutLoading(true);
    try {
      await loadActiveWorkout();
    } finally {
      setWorkoutLoading(false);
    }
  }, [loadActiveWorkout]);

  useRefreshOnFocus(refreshWorkout, [refreshWorkout]);

  const handleClearActive = async () => {
    Alert.alert(
      'Anuluj plan',
      'Czy na pewno chcesz usunąć ten trening z aktywnych?',
      [
        { text: 'Nie', style: 'cancel' },
        {
          text: 'Tak',
          style: 'destructive',
          onPress: async () => {
            await workoutService.clearActiveWorkout();
            setActiveWorkout(null);
            setSelectedDay(null);
            setExercises([]);
          },
        },
      ],
    );
  };

  const handleStartFromPlan = async (workoutId: string, dayOfWeek: number) => {
    setSelectedDay(dayOfWeek);
    await workoutService.setActiveWorkout(workoutId);
    await loadActiveWorkout();
  };

  if (planLoading || workoutLoading) {
    return <LoadingView />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {activePlan && (
          <View style={styles.planSection}>
            <Text style={styles.planSectionTitle}>
              Aktywny plan: {activePlan.name}
            </Text>
            <View style={styles.planDaysRow}>
              {planDays.map((day) => {
                const isToday = today === day.dayOfWeek;
                const isSelected = selectedDay === day.dayOfWeek;

                return (
                  <Pressable
                    key={day.dayOfWeek}
                    style={[
                      styles.planDay,
                      isToday && styles.planDayToday,
                      isSelected && styles.planDaySelected,
                    ]}
                    onPress={() => {
                      if (day.configured?.workout) {
                        handleStartFromPlan(
                          day.configured.workout.id,
                          day.dayOfWeek,
                        );
                      }
                    }}
                    disabled={!day.configured?.workout}
                  >
                    <Text
                      style={[
                        styles.planDayName,
                        isSelected && styles.planDayNameSelected,
                      ]}
                    >
                      {day.dayName.slice(0, 3)}
                    </Text>
                    <Text style={styles.planDayContent} numberOfLines={2}>
                      {day.configured?.isRestDay
                        ? '💤'
                        : day.configured?.workout
                          ? day.configured.workout.name
                          : '—'}
                    </Text>
                    {day.status === 'on_plan' && (
                      <Ionicons
                        name='checkmark-circle'
                        size={14}
                        color={isSelected ? colors.primary : colors.accent}
                        style={styles.planDayStatusIcon}
                      />
                    )}
                    {day.status === 'off_plan' && (
                      <Ionicons
                        name='checkmark'
                        size={14}
                        color={colors.text.secondary}
                        style={styles.planDayStatusIcon}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
        {activeWorkout ? (
          <>
            <View style={styles.activeWorkoutHeader}>
              <Text style={styles.activeWorkoutName}>{activeWorkout.name}</Text>
            </View>
            <ScrollView style={styles.exercisesList}>
              <Text style={styles.exercisesTitle}>Ćwiczenia:</Text>
              {exercises.map((item, index) => (
                <View key={item.id} style={styles.exerciseItem}>
                  <Text style={styles.exerciseName}>
                    {index + 1}. {item.exercise.name}
                  </Text>
                  <Text style={styles.exerciseSets}>
                    {item.sets.length} serii
                  </Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.actions}>
              <Button
                title='🏋️ Rozpocznij trening'
                variant='primary'
                onPress={() => router.push('/active-workout')}
              />
              <Button
                title='Anuluj plan'
                variant='secondary'
                onPress={handleClearActive}
              />
            </View>
          </>
        ) : !activePlan ? (
          <View style={styles.emptyState}>
            <Ionicons
              name='barbell-outline'
              size={64}
              color={colors.text.secondary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>Nie masz aktywnego treningu</Text>
            <Text style={styles.emptySubtitle}>
              Stwórz nowy lub wybierz z biblioteki
            </Text>

            <View style={styles.emptyActions}>
              <Button
                title='+ Stwórz nowy trening'
                variant='primary'
                onPress={() => router.push('/create-workout')}
              />
              {workoutsCount > 0 && (
                <Button
                  title='📚 Wybierz z biblioteki'
                  variant='secondary'
                  onPress={() => router.push('/(tabs)/workouts')}
                />
              )}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exercisesList: {
    flex: 1,
    marginTop: 20,
    marginBottom: 20,
  },
  exercisesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
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
  actions: {
    paddingBottom: 20,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyActions: {
    width: '100%',
    gap: 12,
  },
  activeWorkoutHeader: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  activeWorkoutName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  planSection: {
    marginBottom: 20,
    paddingTop: 10,
  },
  planSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  planDaysRow: {
    flexDirection: 'row',
    gap: 4,
  },
  planDay: {
    flex: 1,
    backgroundColor: colors.secondary,
    padding: 6,
    borderRadius: 8,
    minHeight: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planDayToday: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  planDayName: {
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 12,
    marginBottom: 2,
  },
  planDayContent: {
    color: colors.text.secondary,
    fontSize: 11,
    textAlign: 'center',
  },
  planDaySelected: {
    backgroundColor: colors.accent,
  },
  planDayNameSelected: {
    color: colors.primary,
  },
  planDayStatusIcon: {
    marginTop: 4,
  },
});
