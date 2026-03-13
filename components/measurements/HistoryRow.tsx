import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/Colors';
import { BodyMeasurement } from '@/types/training';
import { BODY_PARTS } from '@/constants/bodyParts';

interface HistoryRowProps {
  entry: BodyMeasurement;
  onDelete: (id: string) => void;
}

export const HistoryRow: React.FC<HistoryRowProps> = ({ entry, onDelete }) => {
  const label =
    BODY_PARTS.find((p) => p.key === entry.bodyPart)?.label ?? entry.bodyPart;
  return (
    <View style={styles.historyRow}>
      <View style={styles.historyLeft}>
        <Text style={styles.historyLabel}>{label}</Text>
        <Text style={styles.historyDate}>{entry.date}</Text>
      </View>
      <View style={styles.historyRight}>
        <Text style={styles.historyValue}>
          {entry.value} <Text style={styles.historyUnit}>cm</Text>
        </Text>
        <Pressable
          onPress={() => onDelete(entry.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name='trash-outline' size={16} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 14,
  },
  historyLeft: {
    gap: 3,
  },
  historyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  historyDate: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  historyUnit: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
  },
});
