import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import colors from '@/constants/Colors';
import { commonStyles } from '@/constants/Styles';
import { WORKOUT_CATEGORIES } from '@/constants/Training';
import { useExerciseStore } from '@/store/exerciseStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { capitalize } from '@/utils/capitalize';

export default function SelectExerciseScreen() {
  const router = useRouter();
  const exercises = useExerciseStore((state) => state.exercises);
  const loading = useExerciseStore((state) => state.loading);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('wszystkie');

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.nameEN &&
        ex.nameEN.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'wszystkie' ||
      selectedCategory === 'ulubione' ||
      ex.categories.includes(selectedCategory);

    const matchesFavorites =
      selectedCategory !== 'ulubione' || favoriteExercises.includes(ex.id);

    return matchesSearch && matchesCategory && matchesFavorites;
  });
  const addExercise = useWorkoutStore((state) => state.addExercise);
  const toggleFavorite = useExerciseStore((state) => state.toggleFavorite);
  const isFavorite = useExerciseStore((state) => state.isFavorite);

  const favoriteExercises = useExerciseStore(
    (state) => state.favoriteExercises,
  );

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
          title='Wszystkie'
          variant={selectedCategory === 'wszystkie' ? 'primary' : 'secondary'}
          onPress={() => setSelectedCategory('wszystkie')}
        />
        <Button
          title='⭐ Ulubione'
          variant={selectedCategory === 'ulubione' ? 'primary' : 'secondary'}
          onPress={() => setSelectedCategory('ulubione')}
        />
        {WORKOUT_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            title={capitalize(cat)}
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
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          renderItem={({ item }) => (
            <Card onPress={() => handleSelectExercise(item.id)}>
              <View style={styles.cardHeader}>
                <View style={styles.cardContent}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <View style={styles.categoriesRow}>
                    {item.categories.map((cat, idx) => (
                      <Text key={idx} style={styles.categoryChip}>
                        {capitalize(cat)}
                      </Text>
                    ))}
                  </View>
                </View>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleFavorite(item.id);
                  }}
                  style={styles.favoriteButton}
                >
                  <Ionicons
                    name={isFavorite(item.id) ? 'star' : 'star-outline'}
                    size={24}
                    color={
                      isFavorite(item.id)
                        ? colors.accent
                        : colors.text.secondary
                    }
                  />
                </Pressable>
              </View>
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
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  categoryChip: { fontSize: 12, color: colors.accent },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
    marginLeft: 8,
  },
});
