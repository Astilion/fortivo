import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/Colors';
import { WeightEntry } from '@/types/training';

interface WeightEntryRowProps {
  entry: WeightEntry;
  weightUnit: string;
  onDelete: (id: string) => void;
  isLatest: boolean;
}

export const WeightEntryRow: React.FC<WeightEntryRowProps> = ({
  entry,
  weightUnit,
  onDelete,
  isLatest,
}) => (
  <View style={[styles.entryRow, isLatest && styles.entryRowLatest]}>
    <View style={styles.entryLeft}>
      {isLatest && (
        <View style={styles.latestBadge}>
          <Text style={styles.latestBadgeText}>OSTATNI</Text>
        </View>
      )}
      <Text style={styles.entryDate}>{entry.date}</Text>
      {entry.notes && (
        <Text style={styles.entryNotes} numberOfLines={1}>
          {entry.notes}
        </Text>
      )}
    </View>
    <View style={styles.entryRight}>
      <Text style={styles.entryWeight}>
        {entry.weight} <Text style={styles.entryWeightUnit}>{weightUnit}</Text>
      </Text>
      <Pressable
        onPress={() => onDelete(entry.id)}
        style={styles.deleteButton}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name='trash-outline' size={16} color={colors.danger} />
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  entryRowLatest: {
    borderWidth: 1,
    borderColor: colors.accent,
  },
  entryLeft: {
    gap: 2,
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  latestBadge: {
    backgroundColor: colors.accent,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  latestBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  entryDate: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  entryNotes: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  entryWeight: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  entryWeightUnit: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
  },
  deleteButton: {
    padding: 4,
  },
});
