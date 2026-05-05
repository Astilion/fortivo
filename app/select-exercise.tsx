import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import colors from '@/constants/Colors';
import { commonStyles } from '@/constants/Styles';
import { useExerciseStore } from '@/store/exerciseStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
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
import { matchesSearch } from '@/utils/search';
import { useLocalSearchParams } from 'expo-router';

export default function SelectExerciseScreen() {
  const router = useRouter();
  const exercises = useExerciseStore((state) => state.exercises);
  const loading = useExerciseStore((state) => state.loading);
  const source = useLocalSearchParams().source as string | undefined;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('wszystkie');
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const addExercise = useWorkoutStore((state) => state.addExercise);
  const setPendingExercise = useWorkoutStore(
    (state) => state.setPendingExercise,
  );
  const activeWorkoutId = useWorkoutStore((state) => state.activeWorkoutId);
  const toggleFavorite = useExerciseStore((state) => state.toggleFavorite);
  const isFavorite = useExerciseStore((state) => state.isFavorite);

  const categories = useExerciseStore((state) => state.categories);
  const favoriteExercises = useExerciseStore(
    (state) => state.favoriteExercises,
  );

  const filteredExercises = exercises.filter((ex) => {
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
  });

  const handleSelectExercise = (exerciseId: string) => {
    const exercise = exercises.find((ex) => ex.id === exerciseId);
    if (!exercise) return;
    if (source === 'active-workout') {
      setPendingExercise(exercise);
      router.back();
    } else {
      addExercise(exercise);
      router.back();
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      if (newSet.size === 0) {
        setIsMultiSelectMode(false);
      }
      return newSet;
    });
  };

  const enterMultiSelectMode = (id: string) => {
    setIsMultiSelectMode(true);
    toggleSelection(id);
  };

  const exitMultiSelectMode = () => {
    setIsMultiSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleMultiAdd = () => {
    selectedIds.forEach((id) => {
      const exercise = exercises.find((ex) => ex.id === id);
      if (!exercise) return;
      addExercise(exercise);
    });
    router.back();
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

      {loading ? (
        <ActivityIndicator size='large' color={colors.accent} />
      ) : (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 80 }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          renderItem={({ item }) => (
            <Card
              onPress={() =>
                isMultiSelectMode
                  ? toggleSelection(item.id)
                  : handleSelectExercise(item.id)
              }
              onLongPress={() => {
                if (!isMultiSelectMode && source !== 'active-workout') {
                  enterMultiSelectMode(item.id);
                }
              }}
              style={
                selectedIds.has(item.id)
                  ? { borderWidth: 2, borderColor: colors.accent }
                  : undefined
              }
            >
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
      {!isMultiSelectMode && (
        <Pressable
          onPress={() => router.push('/create-exercise')}
          style={[styles.fab, { bottom: activeWorkoutId ? 170 : 34 }]}
        >
          <Ionicons name='add' size={28} color='#1C2227' />
        </Pressable>
      )}

      {isMultiSelectMode && (
        <View style={styles.floatingBar}>
          <Button
            title='Anuluj'
            onPress={exitMultiSelectMode}
            variant='secondary'
            style={{ flex: 1 }}
          />
          <Button
            title={`Dodaj (${selectedIds.size})`}
            variant='primary'
            onPress={handleMultiAdd}
            style={{ flex: 1 }}
          />
        </View>
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
  floatingBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
