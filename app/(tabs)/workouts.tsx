import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { WorkoutCard } from '@/components/ui/WorkoutCard';
import colors from '@/constants/Colors';
import { WORKOUT_CATEGORIES } from '@/constants/Training';
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

export default function WorkoutsScreen() {
  const { workoutService } = useApp();
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<'custom' | 'plans'>(
    'custom',
  );

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
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
            console.error('Błąd usuwania:', error);
            Alert.alert('Błąd', 'Nie udało się usunąć');
          }
        },
      },
    ]);
  };

  const moveWorkoutUp = async (index: number) => {
    if (index === 0) return;

    const newWorkouts = [...workouts];
    const [item] = newWorkouts.splice(index, 1);
    newWorkouts.splice(index - 1, 0, item);

    setWorkouts(newWorkouts);

    const workoutIds = newWorkouts.map((w) => w.id);
    await workoutService.reorderWorkouts(workoutIds);
  };

  const moveWorkoutDown = async (index: number) => {
    if (index === workouts.length - 1) return;

    const newWorkouts = [...workouts];
    const [item] = newWorkouts.splice(index, 1);
    newWorkouts.splice(index + 1, 0, item);

    setWorkouts(newWorkouts);

    const workoutIds = newWorkouts.map((w) => w.id);
    await workoutService.reorderWorkouts(workoutIds);
  };

  const setAsActive = async (workoutId: string) => {
    await workoutService.setActiveWorkout(workoutId);
    router.push('/current-workout');
  };

  return (
    <View style={styles.container}>
      <View style={styles.optionsContainer}>
        <Pressable
          style={styles.optionButton}
          onPress={() => setSelectedCategory('custom')}
        >
          <Text
            style={[
              styles.title,
              selectedCategory === 'custom' && styles.activeText,
            ]}
          >
            Własne
          </Text>
        </Pressable>
        <Pressable
          style={[styles.optionButton, styles.rightOption]}
          onPress={() => setSelectedCategory('plans')}
        >
          <Text
            style={[
              styles.title,
              selectedCategory === 'plans' && styles.activeText,
            ]}
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
        {selectedCategory === 'custom' ? (
          <>
            <View style={{ marginBottom: 20 }}>
              <Button
                title='+ Stwórz nowy trening'
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
              workouts.map((workout, index) => (
                <WorkoutCard
                  key={workout.id}
                  workoutName={workout.name}
                  workoutDate={workout.date}
                  exerciseCount={0}
                  onPress={() => router.push(`/edit-workout?id=${workout.id}`)}
                  onDelete={() => handleDeleteWorkout(workout.id, workout.name)}
                  onMoveUp={() => moveWorkoutUp(index)}
                  onMoveDown={() => moveWorkoutDown(index)}
                  isFirst={index === 0}
                  isLast={index === workouts.length - 1}
                  onSetActive={() => setAsActive(workout.id)}
                  isActive={workout.is_active === 1}
                />
              ))
            )}
          </>
        ) : (
          <>
            {WORKOUT_CATEGORIES.map((category) => (
              <Pressable key={category} style={styles.categoryItem}>
                <Text style={styles.categoryItemText}>{category}</Text>
              </Pressable>
            ))}
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
  },
  rightOption: {
    alignItems: 'flex-end',
  },
  text: {
    fontSize: 18,
    color: colors.text.primary,
  },
  activeText: {
    color: colors.accent,
  },
  separator: {
    marginVertical: 20,
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
  workoutItem: {
    backgroundColor: colors.secondary,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutItemText: {
    color: colors.text.primary,
    fontSize: 16,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
});
