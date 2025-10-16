import {
  ActivityIndicator,
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useExerciseStore } from '@/store/exerciseStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { useRouter } from 'expo-router';
import { commonStyles } from '@/constants/Styles';
import { useState } from 'react';
import { WORKOUT_CATEGORIES } from '@/constants/Training';
import colors from '@/constants/Colors';

export default function SelectExerciseScreen() {
  const router = useRouter();
  const exercises = useExerciseStore((state) => state.exercises);
  const loading = useExerciseStore((state) => state.loading);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('wszystkie');

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      ex.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'wszystkie' || ex.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });
  const addExercise = useWorkoutStore((state) => state.addExercise);

  const handleSelectExercise = (exerciseId: string) => {
    const exercise = exercises.find((ex) => ex.id === exerciseId);
    if (exercise) {
      addExercise(exercise);
      router.back();
    }
  };

  return (
    <View style={commonStyles.container}>
      <Input
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder='Wyszukaj ćwiczenie...'
        icon='search'
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <Button
          title='wszystkie'
          variant={selectedCategory === 'wszystkie' ? 'primary' : 'secondary'}
          onPress={() => setSelectedCategory('wszystkie')}
        />
        {WORKOUT_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            title={cat}
            variant={selectedCategory === cat ? 'primary' : 'secondary'}
            onPress={() => setSelectedCategory(cat)}
          />
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size='large' color={colors.accent} />
      ) : (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <Card onPress={() => handleSelectExercise(item.id)}>
              <Text style={styles.exerciseName}>{item.name}</Text>
              <Text style={styles.exerciseCategory}>{item.category}</Text>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  exerciseCategory: {
    color: colors.text.secondary,
  },
  filterContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  filterScroll: {
    marginBottom: 16,
    height: 44,
    flexGrow: 0,
    flexShrink: 0,
  },
});
