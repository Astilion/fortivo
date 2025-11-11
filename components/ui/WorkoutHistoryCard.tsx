import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/Colors';

interface WorkoutHistoryCardProps {
  workoutName: string;
  completedAt: string;
  duration: number;
  onPress: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const WorkoutHistoryCard = ({
  workoutName,
  completedAt,
  duration,
  onPress,
}: WorkoutHistoryCardProps) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.workoutName}>{workoutName}</Text>
        <Ionicons
          name='chevron-forward'
          size={20}
          color={colors.text.secondary}
        />
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.infoItem}>
          <Ionicons
            name='calendar-outline'
            size={16}
            color={colors.text.secondary}
          />
          <Text style={styles.infoText}>{formatDate(completedAt)}</Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons
            name='time-outline'
            size={16}
            color={colors.text.secondary}
          />
          <Text style={styles.infoText}>{duration} min</Text>
        </View>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  cardInfo: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});
