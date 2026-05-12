import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { LoadingView } from '@/components/ui/LoadingView';
import colors from '@/constants/Colors';
import { useExerciseStore } from '@/store/exerciseStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { useToastStore } from '@/store/toastStore';
import { ServiceError } from '@/utils/errors';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { capitalize } from '@/utils/capitalize';
import { confirmAction } from '@/utils/confirm';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { matchesSearch } from '@/utils/search';

export default function ExercisesScreen() {
  const router = useRouter();
  const activeWorkoutId = useWorkoutStore((state) => state.activeWorkoutId);
  const { showToast } = useToastStore();
  const exercises = useExerciseStore((state) => state.exercises);
  const loading = useExerciseStore((state) => state.loading);
  const toggleFavorite = useExerciseStore((state) => state.toggleFavorite);
  const isFavorite = useExerciseStore((state) => state.isFavorite);
  const loadExercises = useExerciseStore((state) => state.loadExercises);
  const deleteExercise = useExerciseStore((state) => state.deleteExercise);

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

  useRefreshOnFocus(loadExercises, [loadExercises]);
  const filteredExercises = useMemo(
    () =>
      exercises.filter((ex) => {
        const matches = matchesSearch(
          searchQuery,
          ex.name,
          ex.nameEN,
          ex.muscleGroups?.join(' '),
          ex.equipment?.join(' '),
        );

        const matchesCategory =
          selectedCategory === 'wszystkie' ||
          selectedCategory === 'ulubione' ||
          selectedCategory === 'wlasne' ||
          ex.categories.includes(selectedCategory);

        const matchesFavorites =
          selectedCategory !== 'ulubione' || favoriteExercises.includes(ex.id);

        const matchesCustom = selectedCategory !== 'wlasne' || ex.isCustom;

        return matches && matchesCategory && matchesFavorites && matchesCustom;
      }),
    [exercises, searchQuery, selectedCategory, favoriteExercises],
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof filteredExercises)[number] }) => (
      <Card onPress={() => router.push(`/exercise-details?id=${item.id}`)}>
        <View style={styles.cardHeader}>
          <View style={styles.cardContent}>
            {item.isCustom && (
              <View style={styles.customBadge}>
                <Text style={styles.customBadgeText}>Własne</Text>
              </View>
            )}
            <Text style={styles.exerciseName}>{item.name}</Text>
            <View style={styles.categoriesRow}>
              {item.categories.map((cat, idx) => (
                <Text key={idx} style={styles.categoryChip}>
                  {capitalize(cat)}
                </Text>
              ))}
            </View>
          </View>
          {item.isCustom && (
            <>
              <Pressable
                style={styles.favoriteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  confirmAction(
                    'Usuń ćwiczenie',
                    'Czy na pewno chcesz usunąć to ćwiczenie?',
                    async () => {
                      try {
                        await deleteExercise(item.id);
                      } catch (error) {
                        if (error instanceof ServiceError) {
                          showToast(error.userMessage, 'error');
                        } else {
                          showToast('Nie udało się usunąć ćwiczenia', 'error');
                        }
                      }
                    },
                  );
                }}
                hitSlop={8}
                accessibilityLabel="Usuń ćwiczenie"
              >
                <Ionicons
                  name='trash-outline'
                  size={24}
                  color={colors.text.secondary}
                />
              </Pressable>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  router.push(`/create-exercise?id=${item.id}`);
                }}
                style={styles.favoriteButton}
                hitSlop={8}
                accessibilityLabel="Edytuj ćwiczenie"
              >
                <Ionicons
                  name='pencil-outline'
                  size={24}
                  color={colors.text.secondary}
                />
              </Pressable>
            </>
          )}
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
            style={styles.favoriteButton}
            hitSlop={8}
            accessibilityLabel={isFavorite(item.id) ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
          >
            <Ionicons
              name={isFavorite(item.id) ? 'star' : 'star-outline'}
              size={24}
              color={isFavorite(item.id) ? colors.accent : colors.text.secondary}
            />
          </Pressable>
        </View>
      </Card>
    ),
    [router, toggleFavorite, isFavorite, deleteExercise, showToast],
  );

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
        <Button
          title='Własne'
          variant={selectedCategory === 'wlasne' ? 'primary' : 'secondary'}
          onPress={() => setSelectedCategory('wlasne')}
        />
        {categories
          .filter((cat) => cat !== 'wszystkie')
          .map((cat) => (
            <Button
              key={cat}
              title={capitalize(cat)}
              variant={selectedCategory === cat ? 'primary' : 'secondary'}
              onPress={() => setSelectedCategory(cat)}
            />
          ))}
      </ScrollView>
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 80 }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListEmptyComponent={
          searchQuery.trim() !== '' ? (
            <EmptyState
              icon='search-outline'
              title='Nie znaleziono ćwiczeń'
              subtitle={`Brak wyników dla "${searchQuery}"`}
            />
          ) : selectedCategory === 'ulubione' ? (
            <EmptyState
              icon='star-outline'
              title='Brak ulubionych ćwiczeń'
              subtitle='Dodaj ćwiczenia do ulubionych gwiazdką'
              action={{ label: 'Przeglądaj wszystkie', onPress: () => setSelectedCategory('wszystkie') }}
            />
          ) : selectedCategory === 'wlasne' ? (
            <EmptyState
              icon='barbell-outline'
              title='Nie masz własnych ćwiczeń'
              action={{ label: 'Dodaj ćwiczenie', onPress: () => router.push('/create-exercise') }}
            />
          ) : (
            <EmptyState
              icon='list-outline'
              title='Brak ćwiczeń w tej kategorii'
            />
          )
        }
        renderItem={renderItem}
      />
      <Pressable
        onPress={() => router.push('/create-exercise')}
        style={[styles.fab, { bottom: activeWorkoutId ? 100 : 34 }]}
      >
        <Ionicons name='add' size={28} color='#1C2227' />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 20,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
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
  fab: {
    position: 'absolute',
    bottom: 34,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  customBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
});
