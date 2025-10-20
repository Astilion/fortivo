import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import colors from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { WORKOUT_CATEGORIES } from '@/constants/Training';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/providers/AppProvider';
import { WorkoutRow } from '@/types/training';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    console.log('📋 Treningi z bazy:', allWorkouts);
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
            alert('Nie udało się usunąć');
          }
        },
      },
    ]);
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
              <Text style={styles.sectionTitle}>
                Nie masz jeszcze treningów
              </Text>
            ) : (
              workouts.map((workout) => (
                <View key={workout.id} style={styles.workoutItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workoutItemText}>{workout.name}</Text>
                  </View>

                  <View style={styles.actionButtons}>
                    <Pressable
                      style={styles.iconButton}
                      onPress={() =>
                        router.push(`/edit-workout?id=${workout.id}`)
                      }
                    >
                      <Ionicons
                        name='pencil'
                        size={20}
                        color={colors.text.secondary}
                      />
                    </Pressable>
                    <Pressable
                      style={styles.iconButton}
                      onPress={() =>
                        handleDeleteWorkout(workout.id, workout.name)
                      }
                    >
                      <Ionicons
                        name='trash-outline'
                        size={20}
                        color={colors.danger}
                      />
                    </Pressable>
                  </View>
                </View>
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
