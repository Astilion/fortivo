import colors from '@/constants/Colors';
import { WeeklyPlanDaySummary, WeeklyPlanWithDays } from '@/types/training';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const DAY_ABBR: Record<number, string> = {
  1: 'Pn',
  2: 'Wt',
  3: 'Śr',
  4: 'Cz',
  5: 'Pt',
  6: 'So',
  0: 'Nd',
};

const DAY_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function sortDays(days: WeeklyPlanDaySummary[]): WeeklyPlanDaySummary[] {
  return [...days].sort(
    (a, b) =>
      DAY_DISPLAY_ORDER.indexOf(a.day_of_week) -
      DAY_DISPLAY_ORDER.indexOf(b.day_of_week),
  );
}

function hasAnyWorkout(days: WeeklyPlanDaySummary[]): boolean {
  return days.some((d) => d.workout_name !== null);
}

interface Props {
  plan: WeeklyPlanWithDays;
  isActive: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
}

export function WeeklyPlanCard({
  plan,
  isActive,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sortedDays = sortDays(plan.days);
  const anyWorkout = hasAnyWorkout(sortedDays);

  return (
    <Pressable
      style={styles.card}
      onPress={() => setIsExpanded((v) => !v)}
      accessibilityLabel={`Plan ${plan.name}`}
    >
      <Text style={styles.planName} numberOfLines={2}>
        {plan.name}
      </Text>

      <View style={styles.controls}>
        {isActive ? (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Aktywny</Text>
            <Pressable onPress={onDeactivate} style={styles.clearBtn} hitSlop={8}>
              <Ionicons name="close-circle-outline" size={18} color={colors.accent} />
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.setActiveBtn} onPress={onActivate}>
            <Text style={styles.setActiveBtnText}>Ustaw aktywny</Text>
          </Pressable>
        )}

        <View style={styles.iconGroup}>
          <Pressable
            onPress={onEdit}
            style={styles.iconBtn}
            hitSlop={4}
            accessibilityLabel="Edytuj plan"
          >
            <Ionicons name="create-outline" size={20} color={colors.accent} />
          </Pressable>
          <Pressable
            onPress={onDelete}
            style={styles.iconBtn}
            hitSlop={6}
            accessibilityLabel="Usuń plan"
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={18}
            color={colors.text.secondary}
          />
        </View>
      </View>

      {isExpanded && (
        <>
          <View style={styles.separator} />
          <View style={styles.daysContainer}>
            {sortedDays.length === 0 || !anyWorkout ? (
              <Text style={styles.emptyDays}>Brak przypisanych treningów</Text>
            ) : (
              sortedDays.map((day) => (
                <View key={day.day_of_week} style={styles.dayRow}>
                  <Text style={styles.dayAbbr}>{DAY_ABBR[day.day_of_week]}</Text>
                  <Text style={styles.daySeparator}>:</Text>
                  {day.workout_name ? (
                    <Text style={styles.dayWorkout} numberOfLines={1}>
                      {day.workout_name}
                    </Text>
                  ) : (
                    <Text style={[styles.dayWorkout, styles.restDay]}>—</Text>
                  )}
                </View>
              ))
            )}
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  planName: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconBtn: {
    padding: 6,
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeBadgeText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearBtn: {
    marginLeft: 6,
    padding: 2,
  },
  setActiveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  setActiveBtnText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: colors.background,
    marginTop: 12,
    marginBottom: 10,
  },
  daysContainer: {
    gap: 2,
  },
  emptyDays: {
    color: colors.text.secondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayAbbr: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
    width: 18,
  },
  daySeparator: {
    color: colors.text.secondary,
    fontSize: 12,
    marginHorizontal: 4,
  },
  dayWorkout: {
    color: colors.text.secondary,
    fontSize: 12,
    flex: 1,
  },
  restDay: {
    fontStyle: 'italic',
  },
});
