import React from 'react';
import { StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/Colors';
import { BodyMeasurement } from '@/types/training';

interface MeasurementRowProps {
  label: string;
  lastEntry?: BodyMeasurement;
  inputValue: string;
  onChangeText: (value: string) => void;
  onAdd: () => void;
}

export const MeasurementRow: React.FC<MeasurementRowProps> = ({
  label,
  lastEntry,
  inputValue,
  onChangeText,
  onAdd,
}) => (
  <View style={styles.measurementRow}>
    <View style={styles.measurementLeft}>
      <Text style={styles.measurementLabel}>{label}</Text>
      {lastEntry ? (
        <Text style={styles.measurementLast}>
          ostatni: {lastEntry.value} cm · {lastEntry.date}
        </Text>
      ) : (
        <Text style={styles.measurementLast}>brak pomiarów</Text>
      )}
    </View>
    <View style={styles.measurementRight}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={onChangeText}
          keyboardType='decimal-pad'
          placeholder='0.0'
          placeholderTextColor={colors.muted}
          maxLength={5}
        />
        <Text style={styles.inputUnit}>cm</Text>
      </View>
      <Pressable style={styles.addButton} onPress={onAdd}>
        <Ionicons name='add' size={20} color={colors.primary} />
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  measurementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 14,
  },
  measurementLeft: {
    flex: 1,
    gap: 3,
  },
  measurementLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  measurementLast: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  measurementRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  input: {
    fontSize: 15,
    color: colors.text.primary,
    minWidth: 44,
    textAlign: 'center',
  },
  inputUnit: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
