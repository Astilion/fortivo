import { View, Text, ScrollView, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useExerciseStore } from '@/store/exerciseStore';
import colors from '@/constants/Colors';
import { capitalize } from '@/utils/capitalize';
import { Button } from '@/components/ui/Button';

export default function ExerciseDetailsScreen() {
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

      <Text style={styles.category}>{exercise.category}</Text>

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
      <View style={{ marginTop: 24 }}>
        <Button
          title=' Link YouTube'
          variant='danger'
          onPress={openYouTubeSearch}
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
  category: {
    fontSize: 16,
    color: colors.accent,
    marginBottom: 24,
    textTransform: 'capitalize',
  },
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
});
