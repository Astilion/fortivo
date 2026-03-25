import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '@/constants/Colors';

interface SummaryCardProps {
  currentWeight?: number;
  goalWeight?: number;
  weightUnit: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  currentWeight,
  goalWeight,
  weightUnit,
}) => {
  const getDiffDisplay = () => {
    if (!currentWeight || !goalWeight) return null;
    if (currentWeight === goalWeight)
      return { text: 'Cel osiągnięty!', color: colors.success };

    const absDiff = Math.abs(currentWeight - goalWeight).toFixed(1);
    return {
      text: `${absDiff} ${weightUnit}`,
      color: colors.text.primary,
    };
  };

  const diffDisplay = getDiffDisplay();

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Aktualna</Text>
        <Text style={styles.summaryValue}>
          {currentWeight ? `${currentWeight} ${weightUnit}` : '--'}
        </Text>
      </View>
      <View style={styles.summarySeparator} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Cel</Text>
        <Text style={styles.summaryValue}>
          {goalWeight ? `${goalWeight} ${weightUnit}` : '--'}
        </Text>
      </View>
      <View style={styles.summarySeparator} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Różnica</Text>
        <Text
          style={[
            styles.summaryValue,
            diffDisplay && { color: diffDisplay.color },
          ]}
        >
          {diffDisplay ? diffDisplay.text : '--'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  summarySeparator: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.background,
    marginVertical: 4,
  },
});
