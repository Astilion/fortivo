import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { WorkoutCard } from '@/components/ui/WorkoutCard';
import colors from '@/constants/Colors';
import { useWeeklyPlanStore } from '@/store/weeklyPlanStore';
import { useApp } from '@/providers/AppProvider';
import { WorkoutWithCountRow } from '@/types/training';
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
import { Ionicons } from '@expo/vector-icons';

type WorkoutsTab = 'workouts' | 'plans' | 'ready';

export default function WorkoutsScreen() {
  const { weeklyPlans, setWeeklyPlans, setActivePlan } = useWeeklyPlanStore();
  const { workoutService, weeklyPlanService } = useApp();
  const [workouts, setWorkouts] = useState<WorkoutWithCountRow[]>([]);
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

  const handleDeleteWeeklyPlan = async (id: string, name: string) => {
    Alert.alert(
      'Usuń plan tygodniowy',
      `Czy na pewno chcesz usunąć plan "${name}"?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            try {
              await weeklyPlanService.deleteWeeklyPlan(id);
              const [plans, activePlan] = await Promise.all([
                weeklyPlanService.getWeeklyPlans(),
                weeklyPlanService.getActivePlan(),
              ]);
              setWeeklyPlans(plans);
              setActivePlan(activePlan);
            } catch (error) {
              logger.error('Błąd usuwania planu', error);
              Alert.alert('Błąd', 'Nie udało się usunąć planu');
            }
          },
        },
      ],
    );
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

  const handleSetActivePlan = async (planId: string) => {
    await weeklyPlanService.setWeeklyPlanActive(planId);

    const [plans, activePlan] = await Promise.all([
      weeklyPlanService.getWeeklyPlans(),
      weeklyPlanService.getActivePlan(),
    ]);
    setWeeklyPlans(plans);
    setActivePlan(activePlan);
  };
  const handleClearActivePlan = async () => {
    Alert.alert(
      'Wyłącz aktywny plan',
      'Plan pozostanie zapisany, ale nie będzie aktywny.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wyłącz',
          onPress: async () => {
            await weeklyPlanService.clearActivePlan();
            const plans = await weeklyPlanService.getWeeklyPlans();
            setWeeklyPlans(plans);
            setActivePlan(null);
          },
        },
      ],
    );
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
                    exerciseCount={workout.exercise_count}
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
                <View key={plan.id} style={styles.planCard}>
                  <Text style={styles.planName}>{plan.name}</Text>

                  <Pressable
                    onPress={() =>
                      router.push(`/create-weekly-plan?id=${plan.id}`)
                    }
                    style={styles.editIcon}
                  >
                    <Ionicons
                      name='create-outline'
                      size={20}
                      color={colors.accent}
                    />
                  </Pressable>

                  {plan.is_active === 1 ? (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Aktywny</Text>
                      <Pressable
                        onPress={handleClearActivePlan}
                        style={styles.clearActiveBtn}
                        hitSlop={8}
                      >
                        <Ionicons
                          name='close-circle-outline'
                          size={18}
                          color={colors.accent}
                        />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.setActiveBtn}
                      onPress={() => handleSetActivePlan(plan.id)}
                    >
                      <Text style={styles.setActiveBtnText}>Ustaw aktywny</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.deleteIcon}
                    onPress={() => handleDeleteWeeklyPlan(plan.id, plan.name)}
                  >
                    <Ionicons
                      name='trash-outline'
                      size={20}
                      color={colors.danger}
                    />
                  </Pressable>
                </View>
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
  planCard: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  editIcon: {
    padding: 8,
    marginRight: 8,
  },
  setActiveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  setActiveBtnText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeBadgeText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteIcon: {
    padding: 6,
    borderRadius: 6,
  },
  clearActiveBtn: {
    marginLeft: 6,
    padding: 2,
  },
});
