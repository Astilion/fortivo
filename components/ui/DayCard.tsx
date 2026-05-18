import colors from '@/constants/Colors';
import { PlanDay } from '@/hooks/useWeeklyPlanData';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

interface DayCardProps {
  day: PlanDay;
  isToday: boolean;
  isSelected: boolean;
  onPress: () => void;
}

export function DayCard({ day, isToday, isSelected, onPress }: DayCardProps) {
  return (
    <Pressable
      style={[
        styles.planDay,
        isToday && styles.planDayToday,
        isSelected && styles.planDaySelected,
      ]}
      onPress={onPress}
      disabled={!day.configured?.workout}
      accessibilityLabel={day.dayName}
    >
      <Text
        style={[styles.planDayName, isSelected && styles.planDayNameSelected]}
      >
        {day.dayName.slice(0, 3)}
      </Text>
      <Text style={styles.planDayContent} numberOfLines={2}>
        {day.configured?.isRestDay
          ? '💤'
          : day.configured?.workout
            ? day.configured.workout.name
            : '—'}
      </Text>
      {day.status === 'on_plan' && (
        <Ionicons
          name="checkmark-circle"
          size={14}
          color={isSelected ? colors.primary : colors.accent}
          style={styles.planDayStatusIcon}
        />
      )}
      {day.status === 'off_plan' && (
        <Ionicons
          name="checkmark"
          size={14}
          color={colors.text.secondary}
          style={styles.planDayStatusIcon}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  planDay: {
    flex: 1,
    backgroundColor: colors.secondary,
    padding: 6,
    borderRadius: 8,
    minHeight: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planDayToday: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  planDaySelected: {
    backgroundColor: colors.accent,
  },
  planDayName: {
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 12,
    marginBottom: 2,
  },
  planDayNameSelected: {
    color: colors.primary,
  },
  planDayContent: {
    color: colors.text.secondary,
    fontSize: 11,
    textAlign: 'center',
  },
  planDayStatusIcon: {
    marginTop: 4,
  },
});
