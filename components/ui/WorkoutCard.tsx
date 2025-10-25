import { View, Text, StyleSheet, Pressable } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/Colors';

interface WorkoutCardProps {
  workoutName: string;
  workoutDate: string;
  exerciseCount: number;
  onPress: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};
const getExerciseLabel = (count: number) => {
  if (count === 1) return 'ćwiczenie';
  if (count >= 2 && count <= 4) return 'ćwiczenia';
  return 'ćwiczeń';
};

export const WorkoutCard = ({
  workoutName,
  workoutDate,
  exerciseCount,
  onPress,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: WorkoutCardProps) => {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Text style={styles.workoutName}>{workoutName}</Text>
          <Text style={styles.metadata}>
            {formatDate(workoutDate)} • {getExerciseLabel(exerciseCount)}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={onMoveUp}
            disabled={isFirst}
            style={[
              styles.reorderButton,
              isFirst && styles.reorderButtonDisabled,
            ]}
          >
            <Ionicons
              name='arrow-up'
              size={18}
              color={isFirst ? colors.text.secondary : colors.accent}
            />
          </Pressable>

          {/* Move Down button */}
          <Pressable
            onPress={onMoveDown}
            disabled={isLast}
            style={[
              styles.reorderButton,
              isLast && styles.reorderButtonDisabled,
            ]}
          >
            <Ionicons
              name='arrow-down'
              size={18}
              color={isLast ? colors.text.secondary : colors.accent}
            />
          </Pressable>

          <Pressable onPress={onDelete} style={styles.deleteButton}>
            <Ionicons name='trash-outline' size={20} color={colors.danger} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  leftSection: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  metadata: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reorderButton: {
    padding: 8,
    borderRadius: 6,
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },

  deleteButton: {
    padding: 8,
  },
});
