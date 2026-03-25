import { Button } from '@/components/ui/Button';
import colors from '@/constants/Colors';
import { useExerciseStore } from '@/store/exerciseStore';
import { capitalize } from '@/utils/capitalize';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
export default function ExerciseDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercises = useExerciseStore((state) => state.exercises);
  const exercise = exercises.find((ex) => ex.id === id);

  if (!exercise) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Nie znaleziono ćwiczenia</Text>
      </View>
    );
  }

  const openYouTubeSearch = () => {
    const searchQuery = encodeURIComponent(exercise.name);
    const url = `https://www.youtube.com/results?search_query=${searchQuery}`;
    Linking.openURL(url);
  };
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{exercise.name}</Text>

      <View style={styles.categoriesRow}>
        {exercise.categories.map((cat, idx) => (
          <Text key={idx} style={styles.categoryChip}>
            {cat}
          </Text>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Partie mięśniowe:</Text>
      {exercise.muscleGroups.map((muscle, index) => (
        <Text key={index} style={styles.listItem}>
          • {capitalize(muscle)}
        </Text>
      ))}

      {exercise.equipment && exercise.equipment.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Sprzęt:</Text>
          {exercise.equipment.map((item, index) => (
            <Text key={index} style={styles.listItem}>
              • {capitalize(item)}
            </Text>
          ))}
        </>
      )}

      {exercise.difficulty && (
        <>
          <Text style={styles.sectionTitle}>Poziom trudności:</Text>
          <Text style={styles.text}>{capitalize(exercise.difficulty)}</Text>
        </>
      )}

      {exercise.instructions && (
        <>
          <Text style={styles.sectionTitle}>Instrukcje:</Text>
          <Text style={styles.text}>{exercise.instructions}</Text>
        </>
      )}
      <View style={styles.buttonSpacing}>
        <Button
          title=' Link YouTube'
          variant='danger'
          onPress={openYouTubeSearch}
        />
      </View>
      <View style={styles.buttonSpacingSmall}>
        <Button
          title='📊 Zobacz historię'
          variant='primary'
          onPress={() =>
            router.push({
              pathname: '/exercise-progress',
              params: { exerciseId: exercise.id, exerciseName: exercise.name },
            })
          }
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 20,
  },
  error: {
    color: colors.danger,
    fontSize: 18,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  categoryChip: { fontSize: 14, color: colors.accent, fontWeight: '600' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 20,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 16,
    color: colors.text.secondary,
    marginLeft: 8,
    marginBottom: 4,
  },
  text: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  buttonSpacing: {
    marginTop: 24,
  },
  buttonSpacingSmall: {
    marginTop: 12,
  },
});
