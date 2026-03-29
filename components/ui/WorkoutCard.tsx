import colors from '@/constants/Colors';
import { formatDate } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface WorkoutCardProps {
  workoutName: string;
  workoutDate: string;
  exerciseCount: number;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleFavorite: () => void;
  isFirst: boolean;
  isLast: boolean;
  isFavorite: boolean;
}

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
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleFavorite,
  isFirst,
  isLast,
  isFavorite,
}: WorkoutCardProps) => {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={styles.nameRow}>
            {isFavorite && (
              <Ionicons name='star' size={14} color={colors.accent} />
            )}
            <Text style={styles.workoutName}>{workoutName}</Text>
          </View>
          <Text style={styles.metadata}>
            {formatDate(workoutDate)} • {exerciseCount}{' '}
            {getExerciseLabel(exerciseCount)}
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={isFirst}
            style={[
              styles.actionButton,
              isFirst && styles.actionButtonDisabled,
            ]}
          >
            <Ionicons
              name='arrow-up'
              size={18}
              color={isFirst ? colors.text.secondary : colors.accent}
            />
          </Pressable>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={isLast}
            style={[styles.actionButton, isLast && styles.actionButtonDisabled]}
          >
            <Ionicons
              name='arrow-down'
              size={18}
              color={isLast ? colors.text.secondary : colors.accent}
            />
          </Pressable>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            style={styles.actionButton}
          >
            <Ionicons
              name={isFavorite ? 'star' : 'star-outline'}
              size={20}
              color={isFavorite ? colors.accent : colors.text.secondary}
            />
          </Pressable>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={styles.actionButton}
          >
            <Ionicons name='create-outline' size={20} color={colors.accent} />
          </Pressable>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={styles.actionButton}
          >
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  metadata: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
  },
  actionButtonDisabled: {
    opacity: 0.3,
  },
});
