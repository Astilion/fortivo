import { StyleSheet, View, Text, FlatList, ScrollView } from 'react-native';
import { useState } from 'react';
import colors from '@/constants/Colors';
import { useExerciseStore } from '@/store/exerciseStore';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'expo-router';
import { WORKOUT_CATEGORIES } from '@/constants/Training';
import { Button } from '@/components/ui/Button';
import { LoadingView } from '@/components/ui/LoadingView';

export default function ExercisesScreen() {
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

  if (loading) {
    return <LoadingView />;
  }

  return (
    <View style={styles.container}>
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
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12 }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/exercise-details?id=${item.id}`)}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            <Text style={styles.exerciseCategory}>{item.category}</Text>
          </Card>
        )}
      />
      )
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 20,
  },
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
