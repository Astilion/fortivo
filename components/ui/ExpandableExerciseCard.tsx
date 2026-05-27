import colors from '@/constants/Colors';
import { WorkoutSet } from '@/types/training';
import { Ionicons } from '@expo/vector-icons';
import { parseDecimal, parseInteger } from '@/utils/numbers';
import { validateRPE, validateTempo } from '@/utils/validation';
import { confirmAction } from '@/utils/confirm';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface ExpandableExerciseCardProps {
  exerciseName: string;
  exerciseCategories: string[];
  measurementType?: 'reps' | 'time' | 'distance';
  weightUnit?: 'kg' | 'lbs';
  trackRPE?: boolean;
  trackTempo?: boolean;
  trackRestTime?: boolean;
  sets: WorkoutSet[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemoveExercise: () => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onUpdateSet: (setId: string, updates: Partial<WorkoutSet>) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export const ExpandableExerciseCard = ({
  exerciseName,
  exerciseCategories,
  measurementType = 'reps',
  weightUnit = 'kg',
  trackRPE = false,
  trackTempo = false,
  trackRestTime = false,
  sets,
  isExpanded,
  onToggleExpand,
  onRemoveExercise,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
}: ExpandableExerciseCardProps) => {
  // Bumped to force RPE/tempo inputs to reset their defaultValue after an
  // invalid entry (same pattern as active-workout).
  const [validationKey, setValidationKey] = useState(0);

  const getLabel = () => {
    switch (measurementType) {
      case 'time':
        return 'Czas (s)';
      case 'distance':
        return 'Dyst. (m)';
      default:
        return 'Powt.';
    }
  };

  const getPlaceholder = () => {
    switch (measurementType) {
      case 'time':
        return '30';
      case 'distance':
        return '50';
      default:
        return '8';
    }
  };

  const getCurrentValue = (set: WorkoutSet) => {
    switch (measurementType) {
      case 'time':
        return set.duration;
      case 'distance':
        return set.distance;
      default:
        return set.reps;
    }
  };

  return (
    <View style={styles.card}>
      <Pressable onPress={onToggleExpand} style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={20}
            color={colors.text.secondary}
          />
          <View style={styles.titleContainer}>
            <Text style={styles.exerciseName}>{exerciseName}</Text>
            <View style={styles.categoriesContainer}>
              {exerciseCategories.map((cat, idx) => (
                <View key={idx} style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>{cat}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          {onMoveUp && (
            <Pressable
              onPress={onMoveUp}
              disabled={isFirst}
              style={[
                styles.reorderButton,
                isFirst && styles.reorderButtonDisabled,
              ]}
              hitSlop={5}
              accessibilityLabel="Przesuń ćwiczenie w górę"
            >
              <Ionicons
                name="arrow-up"
                size={18}
                color={isFirst ? colors.text.secondary : colors.accent}
              />
            </Pressable>
          )}

          {onMoveDown && (
            <Pressable
              onPress={onMoveDown}
              disabled={isLast}
              style={[
                styles.reorderButton,
                isLast && styles.reorderButtonDisabled,
              ]}
              hitSlop={5}
              accessibilityLabel="Przesuń ćwiczenie w dół"
            >
              <Ionicons
                name="arrow-down"
                size={18}
                color={isLast ? colors.text.secondary : colors.accent}
              />
            </Pressable>
          )}

          <Pressable
            onPress={onRemoveExercise}
            style={styles.deleteButton}
            hitSlop={4}
            accessibilityLabel="Usuń ćwiczenie"
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        </View>
      </Pressable>

      {isExpanded && (
        <View style={styles.expandedContent}>
          {sets.map((set, index) => (
            <View key={set.id} style={styles.setRow}>
              <View style={styles.setRowHeader}>
                <Text style={styles.setNumberText}>{`Seria ${index + 1}`}</Text>
                {sets.length > 1 && (
                  <Pressable
                    onPress={() =>
                      confirmAction(
                        'Usuń serię',
                        'Czy na pewno chcesz usunąć tę serię?',
                        () => onRemoveSet(set.id),
                      )
                    }
                    hitSlop={4}
                    accessibilityLabel="Usuń serię"
                  >
                    <Ionicons
                      name="close-circle"
                      size={22}
                      color={colors.danger}
                    />
                  </Pressable>
                )}
              </View>

              <View style={styles.inputsRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {`Ciężar (${weightUnit})`}
                  </Text>
                  <TextInput
                    key={`weight-${set.id}-${set.weight}`}
                    style={styles.input}
                    defaultValue={set.weight?.toString() || '0'}
                    onEndEditing={(e) => {
                      const weight = parseDecimal(e.nativeEvent.text);
                      onUpdateSet(set.id, { weight });
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.text.secondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{getLabel()}</Text>
                  <TextInput
                    key={`value-${set.id}-${getCurrentValue(set)}`}
                    style={styles.input}
                    defaultValue={getCurrentValue(set)?.toString() || ''}
                    onEndEditing={(e) => {
                      const value =
                        measurementType === 'distance'
                          ? parseDecimal(e.nativeEvent.text)
                          : parseInteger(e.nativeEvent.text);

                      const updates: Partial<WorkoutSet> =
                        measurementType === 'time'
                          ? { duration: value }
                          : measurementType === 'distance'
                            ? { distance: value }
                            : { reps: value };

                      onUpdateSet(set.id, updates);
                    }}
                    keyboardType={
                      measurementType === 'distance' ? 'decimal-pad' : 'numeric'
                    }
                    placeholder={getPlaceholder()}
                    placeholderTextColor={colors.text.secondary}
                  />
                </View>

                {trackRPE && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>RPE</Text>
                    <TextInput
                      key={`rpe-${set.id}-${set.rpe}-${validationKey}`}
                      style={styles.input}
                      defaultValue={set.rpe?.toString() || ''}
                      onEndEditing={(e) => {
                        const validated = validateRPE(e.nativeEvent.text);
                        if (validated === null && e.nativeEvent.text.trim()) {
                          setValidationKey((prev) => prev + 1);
                        }
                        onUpdateSet(set.id, { rpe: validated ?? undefined });
                      }}
                      keyboardType="decimal-pad"
                      placeholder="1-10"
                      placeholderTextColor={colors.text.secondary}
                    />
                  </View>
                )}

                {trackTempo && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Tempo</Text>
                    <TextInput
                      key={`tempo-${set.id}-${set.tempo}-${validationKey}`}
                      style={styles.input}
                      defaultValue={set.tempo || ''}
                      onEndEditing={(e) => {
                        const validated = validateTempo(e.nativeEvent.text);
                        if (validated === null && e.nativeEvent.text.trim()) {
                          setValidationKey((prev) => prev + 1);
                        }
                        onUpdateSet(set.id, { tempo: validated ?? undefined });
                      }}
                      placeholder="3-1-2"
                      placeholderTextColor={colors.text.secondary}
                    />
                  </View>
                )}

                {trackRestTime && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Przerwa (s)</Text>
                    <TextInput
                      key={`rest-${set.id}-${set.restTime}`}
                      style={styles.input}
                      defaultValue={set.restTime?.toString() || ''}
                      onEndEditing={(e) => {
                        const restTime =
                          parseInteger(e.nativeEvent.text) || undefined;
                        onUpdateSet(set.id, { restTime });
                      }}
                      keyboardType="numeric"
                      placeholder="90"
                      placeholderTextColor={colors.text.secondary}
                    />
                  </View>
                )}
              </View>
            </View>
          ))}

          <Pressable style={styles.addSetButton} onPress={onAddSet}>
            <Ionicons
              name="add-circle-outline"
              size={18}
              color={colors.accent}
            />
            <Text style={styles.addSetButtonText}>Dodaj serię</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  titleContainer: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  categoryChip: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryChipText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  headerActions: {
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

  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },

  // ===== Set rows =====
  setRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  setRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  setNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ===== Inputs =====
  inputsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  inputGroup: {
    minWidth: 60,
    flexGrow: 1,
    flexBasis: '20%',
  },
  inputLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 6,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 6,
    fontSize: 14,
    color: colors.text.primary,
    textAlign: 'center',
  },

  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.accent + '40',
  },
  addSetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
});
