import colors from '@/constants/Colors';
import { PresetWorkout } from '@/types/presets';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface PresetWorkoutCardProps {
  preset: PresetWorkout;
  onPress: () => void;
}

const getExerciseLabel = (count: number) => {
  if (count === 1) return 'ćwiczenie';
  if (count >= 2 && count <= 4) return 'ćwiczenia';
  return 'ćwiczeń';
};

const getCategoryLabel = (category: PresetWorkout['category']) => {
  if (category === 'basic') return 'Podstawowe';
  return 'Premium';
};

export const PresetWorkoutCard = ({
  preset,
  onPress,
}: PresetWorkoutCardProps) => {
  const exerciseCount = preset.exercises.length;

  return (
    <Pressable
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`Gotowy trening ${preset.name}`}
    >
      <View style={styles.topRow}>
        <Text style={styles.name} numberOfLines={1}>
          {preset.name}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{getCategoryLabel(preset.category)}</Text>
        </View>
      </View>

      {preset.description && (
        <Text style={styles.description} numberOfLines={2}>
          {preset.description}
        </Text>
      )}

      <View style={styles.metaRow}>
        <Text style={styles.meta}>
          {exerciseCount} {getExerciseLabel(exerciseCount)}
        </Text>
        {preset.estimatedDurationMinutes !== undefined && (
          <>
            <Text style={styles.metaSeparator}>·</Text>
            <Text style={styles.meta}>~{preset.estimatedDurationMinutes} min</Text>
          </>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  metaSeparator: {
    fontSize: 13,
    color: colors.text.secondary,
  },
});
