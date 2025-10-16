import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import colors from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { WORKOUT_CATEGORIES } from '@/constants/Training';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/providers/AppProvider';
import { WorkoutRow } from '@/types/training';

export default function WorkoutsScreen() {
  const { workoutService } = useApp();
const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);

  // Załaduj treningi przy starcie
  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    const allWorkouts = await workoutService.getAllWorkouts();
    console.log('📋 Treningi z bazy:', allWorkouts);
    setWorkouts(allWorkouts);
  };

  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<'custom' | 'plans'>(
    'custom',
  );

  // Placeholder for custom workouts
  const customWorkouts = [
    { id: 1, name: 'Trening A' },
    { id: 2, name: 'Trening B' },
    { id: 3, name: 'Nogi i Pośladki' },
  ];

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

            {customWorkouts.map((workout) => (
              <Pressable key={workout.id} style={styles.workoutItem}>
                <Text style={styles.workoutItemText}>{workout.name}</Text>
              </Pressable>
            ))}
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
});
