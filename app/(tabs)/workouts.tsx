import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { EmptyTabState } from '@/components/ui/EmptyTabState';
import { LoadingView } from '@/components/ui/LoadingView';
import { PresetWorkoutCard } from '@/components/ui/PresetWorkoutCard';
import { WeeklyPlanCard } from '@/components/ui/WeeklyPlanCard';
import { WorkoutCard } from '@/components/ui/WorkoutCard';
import colors from '@/constants/Colors';
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore';
import { useWeeklyPlanStore } from '@/store/weeklyPlanStore';
import { useToastStore } from '@/store/toastStore';
import { useApp } from '@/providers/AppProvider';
import { PresetWorkout } from '@/types/presets';
import { WorkoutWithCountRow } from '@/types/training';
import { confirmAction } from '@/utils/confirm';
import { ServiceError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useStartWorkout } from '@/hooks/useStartWorkout';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type WorkoutsTab = 'workouts' | 'plans' | 'ready';

export default function WorkoutsScreen() {
  const [workouts, setWorkouts] = useState<WorkoutWithCountRow[]>([]);
  const [selectedTab, setSelectedTab] = useState<WorkoutsTab>('workouts');
  const [isLoading, setIsLoading] = useState(true);
  const { weeklyPlans, setWeeklyPlans, setActivePlan } = useWeeklyPlanStore();
  const activeWorkoutId = useActiveWorkoutStore((state) => state.workoutId);
  const { workoutService, weeklyPlanService, presetService } = useApp();
  const { showToast } = useToastStore();
  const router = useRouter();
  const startWorkout = useStartWorkout();
  const presetWorkouts = presetService.getPresetWorkouts();

  useRefreshOnFocus(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [allWorkouts, plans] = await Promise.all([
          workoutService.getAllWorkouts(),
          weeklyPlanService.getAllPlansWithDetails(),
        ]);
        setWorkouts(allWorkouts);
        setWeeklyPlans(plans);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const loadWorkouts = async () => {
    const allWorkouts = await workoutService.getAllWorkouts();
    setWorkouts(allWorkouts);
  };

  // Editing the active workout would DELETE+reinsert its rows while the
  // in-memory session still holds the old ids — autosave would then silently
  // resurrect them and wipe the edit. Block until the session ends.
  const handleEditWorkout = (workoutId: string) => {
    if (workoutId === activeWorkoutId) {
      showToast('Zakończ lub odrzuć aktywny trening, żeby go edytować', 'info');
      return;
    }
    router.push(`/edit-workout?id=${workoutId}`);
  };

  const handleDeleteWorkout = (id: string, name: string) => {
    confirmAction(
      'Usuń trening',
      `Czy na pewno chcesz usunąć "${name}"?`,
      async () => {
        try {
          await workoutService.deleteWorkout(id);
          showToast('Trening usunięty', 'info');
          // Deleting a workout nulls its plan-day links (SET NULL); refresh the
          // plan slices too so the list doesn't show a stale workout name.
          const [allWorkouts, plans, activePlan] = await Promise.all([
            workoutService.getAllWorkouts(),
            weeklyPlanService.getAllPlansWithDetails(),
            weeklyPlanService.getActivePlan(),
          ]);
          setWorkouts(allWorkouts);
          setWeeklyPlans(plans);
          setActivePlan(activePlan);
        } catch (error) {
          logger.error('Błąd usuwania:', error);
          if (error instanceof ServiceError) {
            showToast(error.userMessage, 'error');
          } else {
            showToast('Nie udało się usunąć treningu', 'error');
          }
        }
      },
    );
  };

  const handleDeleteWeeklyPlan = (id: string, name: string) => {
    confirmAction(
      'Usuń plan tygodniowy',
      `Czy na pewno chcesz usunąć plan "${name}"?`,
      async () => {
        try {
          await weeklyPlanService.deleteWeeklyPlan(id);
          const [plans, activePlan] = await Promise.all([
            weeklyPlanService.getAllPlansWithDetails(),
            weeklyPlanService.getActivePlan(),
          ]);
          setWeeklyPlans(plans);
          setActivePlan(activePlan);
        } catch (error) {
          logger.error('Błąd usuwania planu', error);
          if (error instanceof ServiceError) {
            showToast(error.userMessage, 'error');
          } else {
            showToast('Nie udało się usunąć planu', 'error');
          }
        }
      },
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
    try {
      await workoutService.reorderWorkouts(newWorkouts.map((w) => w.id));
    } catch (error) {
      logger.error('Błąd zmiany kolejności', error);
      if (error instanceof ServiceError) {
        showToast(error.userMessage, 'error');
      } else {
        showToast('Nie udało się zmienić kolejności', 'error');
      }
      // Revert the optimistic reorder to whatever the DB actually holds.
      loadWorkouts();
    }
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
    try {
      await workoutService.reorderWorkouts(newWorkouts.map((w) => w.id));
    } catch (error) {
      logger.error('Błąd zmiany kolejności', error);
      if (error instanceof ServiceError) {
        showToast(error.userMessage, 'error');
      } else {
        showToast('Nie udało się zmienić kolejności', 'error');
      }
      // Revert the optimistic reorder to whatever the DB actually holds.
      loadWorkouts();
    }
  };

  const handleToggleFavorite = async (workoutId: string) => {
    try {
      await workoutService.toggleFavoriteWorkout(workoutId);
      await loadWorkouts();
    } catch (error) {
      logger.error('Błąd zmiany ulubionych', error);
      if (error instanceof ServiceError) {
        showToast(error.userMessage, 'error');
      } else {
        showToast('Nie udało się zmienić ulubionych', 'error');
      }
    }
  };

  const setAsActive = (workoutId: string) => {
    startWorkout(workoutId, () => router.push('/(tabs)/current-workout'));
  };

  const handleSetActivePlan = async (planId: string) => {
    try {
      await weeklyPlanService.setWeeklyPlanActive(planId);
      const [plans, activePlan] = await Promise.all([
        weeklyPlanService.getAllPlansWithDetails(),
        weeklyPlanService.getActivePlan(),
      ]);
      setWeeklyPlans(plans);
      setActivePlan(activePlan);
    } catch (error) {
      logger.error('Błąd aktywacji planu', error);
      if (error instanceof ServiceError) {
        showToast(error.userMessage, 'error');
      } else {
        showToast('Nie udało się aktywować planu', 'error');
      }
    }
  };

  const renderPresetCard = useCallback(
    (preset: PresetWorkout) => (
      <PresetWorkoutCard
        key={preset.id}
        preset={preset}
        onPress={() =>
          router.push(`/preset-workout-details?presetId=${preset.id}`)
        }
      />
    ),
    [router],
  );

  const handleClearActivePlan = () => {
    confirmAction(
      'Wyłącz aktywny plan',
      'Plan pozostanie zapisany, ale nie będzie aktywny.',
      async () => {
        try {
          await weeklyPlanService.clearActivePlan();
          const plans = await weeklyPlanService.getAllPlansWithDetails();
          setWeeklyPlans(plans);
          setActivePlan(null);
        } catch (error) {
          logger.error('Błąd wyłączania planu', error);
          if (error instanceof ServiceError) {
            showToast(error.userMessage, 'error');
          } else {
            showToast('Nie udało się wyłączyć planu', 'error');
          }
        }
      },
      'Wyłącz',
    );
  };

  if (isLoading) {
    return <LoadingView />;
  }

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
          style={styles.optionButton}
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
                title="Stwórz nowy trening"
                variant="primary"
                onPress={() => router.push('/create-workout')}
              />
            </View>

            <Text style={styles.sectionTitle}>
              Twoje Własne Plany Treningowe:
            </Text>

            {workouts.length === 0 ? (
              <EmptyState
                icon="barbell-outline"
                title="Nie masz jeszcze treningów"
                subtitle="Stwórz swój pierwszy plan treningowy"
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
                    exerciseCount={workout.exercise_count}
                    onPress={() => setAsActive(workout.id)}
                    onEdit={() => handleEditWorkout(workout.id)}
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
                title="Stwórz nowy plan"
                variant="primary"
                onPress={() => router.push('/create-weekly-plan')}
              />
            </View>
            <Text style={styles.sectionTitle}>Twoje Plany Tygodniowe:</Text>

            {weeklyPlans.length === 0 ? (
              <EmptyTabState
                icon="calendar-outline"
                title="Nie masz planów tygodniowych"
                subtitle="Stwórz swój pierwszy plan"
              />
            ) : (
              weeklyPlans.map((plan) => (
                <WeeklyPlanCard
                  key={plan.id}
                  plan={plan}
                  isActive={plan.is_active === 1}
                  onEdit={() =>
                    router.push(`/create-weekly-plan?id=${plan.id}`)
                  }
                  onDelete={() => handleDeleteWeeklyPlan(plan.id, plan.name)}
                  onActivate={() => handleSetActivePlan(plan.id)}
                  onDeactivate={handleClearActivePlan}
                />
              ))
            )}
          </>
        )}
        {selectedTab === 'ready' && (
          <>
            {presetWorkouts.length === 0 ? (
              <EmptyTabState
                icon="hourglass-outline"
                title="Wkrótce — gotowe treningi"
              />
            ) : (
              presetWorkouts.map(renderPresetCard)
            )}
          </>
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
    justifyContent: 'center',
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
    textAlign: 'center',
  },
  createButtonWrapper: {
    marginBottom: 20,
  },
});
