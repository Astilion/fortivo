import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { WorkoutCard } from '@/components/ui/WorkoutCard';
import colors from '@/constants/Colors';
import { useWeeklyPlanStore } from '@/store/weeklyPlanStore';
import { useApp } from '@/providers/AppProvider';
import { WorkoutRow } from '@/types/training';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { logger } from '@/utils/logger';

type WorkoutsTab = 'workouts' | 'plans' | 'ready';

export default function WorkoutsScreen() {
  const { weeklyPlans, setWeeklyPlans } = useWeeklyPlanStore();
  const { workoutService, weeklyPlanService } = useApp();
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<WorkoutsTab>('workouts');

  useFocusEffect(
    useCallback(() => {
      const loadWeeklyPlans = async () => {
        const plans = await weeklyPlanService.getWeeklyPlans();
        setWeeklyPlans(plans);
      };
      loadWorkouts();
      loadWeeklyPlans();
    }, []),
  );
  const loadWorkouts = async () => {
    const allWorkouts = await workoutService.getAllWorkouts();
    setWorkouts(allWorkouts);
  };

  const handleDeleteWorkout = async (id: string, name: string) => {
    Alert.alert('Usuń trening', `Czy na pewno chcesz usunąć "${name}"?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          try {
            await workoutService.deleteWorkout(id);
            loadWorkouts();
          } catch (error) {
            logger.error('Błąd usuwania:', error);
            Alert.alert('Błąd', 'Nie udało się usunąć');
          }
        },
      },
    ]);
  };

  const moveWorkoutUp = async (index: number) => {
    if (index === 0) return;

    const current = workouts[index];
    const above = workouts[index - 1];

    if (!current.is_favorite && above.is_favorite) return;

    const newWorkouts = [...workouts];
    const [item] = newWorkouts.splice(index, 1);
    newWorkouts.splice(index - 1, 0, item);

    setWorkouts(newWorkouts);
    await workoutService.reorderWorkouts(newWorkouts.map((w) => w.id));
  };

  const moveWorkoutDown = async (index: number) => {
    if (index === workouts.length - 1) return;

    const current = workouts[index];
    const below = workouts[index + 1];

    if (current.is_favorite && !below.is_favorite) return;

    const newWorkouts = [...workouts];
    const [item] = newWorkouts.splice(index, 1);
    newWorkouts.splice(index + 1, 0, item);

    setWorkouts(newWorkouts);
    await workoutService.reorderWorkouts(newWorkouts.map((w) => w.id));
  };

  const handleToggleFavorite = async (workoutId: string) => {
    await workoutService.toggleFavoriteWorkout(workoutId);
    await loadWorkouts();
  };

  const setAsActive = async (workoutId: string) => {
    await workoutService.setActiveWorkout(workoutId);
    router.push('/(tabs)/current-workout');
  };

  return (
    <View style={styles.container}>
      <View style={styles.optionsContainer}>
        <Pressable
          style={styles.optionButton}
          onPress={() => setSelectedTab('workouts')}
        >
          <Text
            style={[
              styles.title,
              selectedTab === 'workouts' && styles.activeText,
            ]}
          >
            Treningi
          </Text>
        </Pressable>
        <Pressable
          style={styles.optionButton}
          onPress={() => setSelectedTab('plans')}
        >
          <Text
            style={[styles.title, selectedTab === 'plans' && styles.activeText]}
          >
            Plany Tygodniowe
          </Text>
        </Pressable>
        <Pressable
          style={[styles.optionButton, styles.rightOption]}
          onPress={() => setSelectedTab('ready')}
        >
          <Text
            style={[styles.title, selectedTab === 'ready' && styles.activeText]}
          >
            Gotowe
          </Text>
        </Pressable>
      </View>

      <View style={styles.separator} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {selectedTab === 'workouts' && (
          <>
            <View style={styles.createButtonWrapper}>
              <Button
                title='Stwórz nowy trening'
                variant='primary'
                onPress={() => router.push('/create-workout')}
              />
            </View>

            <Text style={styles.sectionTitle}>
              Twoje Własne Plany Treningowe:
            </Text>

            {workouts.length === 0 ? (
              <EmptyState
                icon='barbell-outline'
                title='Nie masz jeszcze treningów'
                subtitle='Stwórz swój pierwszy plan treningowy'
              />
            ) : (
              workouts.map((workout, index) => {
                const above = workouts[index - 1];
                const below = workouts[index + 1];

                const canMoveUp =
                  index > 0 &&
                  !(workout.is_favorite === 0 && above?.is_favorite === 1);
                const canMoveDown =
                  index < workouts.length - 1 &&
                  !(workout.is_favorite === 1 && below?.is_favorite === 0);

                return (
                  <WorkoutCard
                    key={workout.id}
                    workoutName={workout.name}
                    workoutDate={workout.date}
                    exerciseCount={0}
                    onPress={() => setAsActive(workout.id)}
                    onEdit={() => router.push(`/edit-workout?id=${workout.id}`)}
                    onDelete={() =>
                      handleDeleteWorkout(workout.id, workout.name)
                    }
                    onMoveUp={() => moveWorkoutUp(index)}
                    onMoveDown={() => moveWorkoutDown(index)}
                    onToggleFavorite={() => handleToggleFavorite(workout.id)}
                    isFirst={!canMoveUp}
                    isLast={!canMoveDown}
                    isFavorite={workout.is_favorite === 1}
                  />
                );
              })
            )}
          </>
        )}
        {selectedTab === 'plans' && (
          <>
            <View style={styles.createButtonWrapper}>
              <Button
                title='Stwórz nowy plan'
                variant='primary'
                onPress={() => router.push('/create-weekly-plan')}
              />
            </View>
            <Text style={styles.sectionTitle}>Twoje Plany Tygodniowe:</Text>

            {weeklyPlans.length === 0 ? (
              <EmptyState
                icon='calendar-outline'
                title='Nie masz planów tygodniowych'
                subtitle='Stwórz swój pierwszy plan'
              />
            ) : (
              weeklyPlans.map((plan) => (
                <Pressable key={plan.id} style={styles.categoryItem}>
                  <Text style={styles.categoryItemText}>{plan.name}</Text>
                </Pressable>
              ))
            )}
          </>
        )}
        {selectedTab === 'ready' && (
          <EmptyState icon='hourglass-outline' title='Wkrótce dostępne' />
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
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  optionButton: {
    flex: 1,
    justifyContent: 'space-between',
  },
  rightOption: {
    alignItems: 'flex-end',
  },
  activeText: {
    color: colors.accent,
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '80%',
    alignSelf: 'center',
    backgroundColor: colors.text.primary,
  },
  content: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 15,
  },
  categoryItem: {
    backgroundColor: colors.secondary,
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  categoryItemText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  createButtonWrapper: {
    marginBottom: 20,
  },
});
