import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingView } from '@/components/ui/LoadingView';
import colors from '@/constants/Colors';
import { useExerciseStore } from '@/store/exerciseStore';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { capitalize } from '@/utils/capitalize';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function ExercisesScreen() {
  const router = useRouter();
  const exercises = useExerciseStore((state) => state.exercises);
  const loading = useExerciseStore((state) => state.loading);
  const toggleFavorite = useExerciseStore((state) => state.toggleFavorite);
  const isFavorite = useExerciseStore((state) => state.isFavorite);

  const favoriteExercises = useExerciseStore(
    (state) => state.favoriteExercises,
  );
  const categories = useExerciseStore((state) => state.categories);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('wszystkie');

    useEffect(() => {
    if (selectedCategory !== 'wszystkie') {
      setSearchQuery('');
    }
  }, [selectedCategory]); 

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
          title='Wszystkie'
          variant={selectedCategory === 'wszystkie' ? 'primary' : 'secondary'}
          onPress={() => setSelectedCategory('wszystkie')}
        />
        <Button
          title='⭐ Ulubione'
          variant={selectedCategory === 'ulubione' ? 'primary' : 'secondary'}
          onPress={() => setSelectedCategory('ulubione')}
        />
        {categories
          .filter((cat) => cat !== 'wszystkie')
          .map((cat) => (
            <Button
              key={cat}
              title={capitalize(cat)} // <-- KAPITALIZUJ
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
                    isFavorite(item.id) ? colors.accent : colors.text.secondary
                  }
                />
              </Pressable>
            </View>
          </Card>
        )}
      />
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
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  categoryChip: { fontSize: 12, color: colors.accent },
  filterContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
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
  filterScroll: {
    marginBottom: 16,
    height: 44,
    flexGrow: 0,
    flexShrink: 0,
  },
});
