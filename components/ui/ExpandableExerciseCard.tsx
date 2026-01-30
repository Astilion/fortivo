import colors from '@/constants/Colors';
import { WorkoutSet } from '@/types/training';
import { Ionicons } from '@expo/vector-icons';
import { parseDecimal, parseInteger } from '@/utils/numbers';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface ExpandableExerciseCardProps {
  exerciseName: string;
  exerciseCategories: string[];
  exerciseId: string;
  measurementType?: 'reps' | 'time' | 'distance';
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
  exerciseId,
  measurementType = 'reps',
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
  const getLabel = () => {
    switch (measurementType) {
      case 'time':
        return 'Czas (s)';
      case 'distance':
        return 'Dystans (m)';
      default:
        return 'Powtórzenia';
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
      {/* Header */}
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

        {/* Reorder & Delete buttons */}
        <View style={styles.headerActions}>
          {/* Move Up button */}
          {onMoveUp && (
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
          )}

          {/* Move Down button */}
          {onMoveDown && (
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
          )}

          {/* Delete button */}
          <Pressable onPress={onRemoveExercise} style={styles.deleteButton}>
            <Ionicons name='trash-outline' size={20} color={colors.danger} />
          </Pressable>
        </View>
      </Pressable>

      {/* Sets Accordion */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.setColumnHeader]}>
              Seria
            </Text>
            <Text style={[styles.tableHeaderText, styles.weightColumnHeader]}>
              Obciążenie
            </Text>
            <Text style={[styles.tableHeaderText, styles.repsColumnHeader]}>
              {getLabel()}
            </Text>
            <View style={styles.actionColumnHeader} />
          </View>

          {/* Sets list */}
          {sets.map((set, index) => (
            <View key={set.id} style={styles.setRow}>
              {/* Set number */}
              <View style={styles.setColumn}>
                <Text style={styles.setText}>{index + 1}</Text>
              </View>

              <View style={styles.weightColumn}>
                <TextInput
                  key={`weight-${set.id}-${set.weight}`} 
                  style={styles.input}
                  defaultValue={set.weight?.toString() || '0'} 
                  onEndEditing={(e) => {
                    const weight = parseDecimal(e.nativeEvent.text);
                    onUpdateSet(set.id, { weight });
                  }}
                  keyboardType='decimal-pad' 
                  placeholder='0'
                  placeholderTextColor={colors.text.secondary}
                />
                <Text style={styles.unitText}>kg</Text>
              </View>

              <View style={styles.repsColumn}>
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

              {/* Delete set */}
              <View style={styles.actionColumn}>
                {sets.length > 1 && (
                  <Pressable onPress={() => onRemoveSet(set.id)}>
                    <Ionicons
                      name='close-circle'
                      size={22}
                      color={colors.danger}
                    />
                  </Pressable>
                )}
              </View>
            </View>
          ))}

          {/* Add set */}
          <Pressable style={styles.addSetButton} onPress={onAddSet}>
            <Ionicons
              name='add-circle-outline'
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

  // ===== Table Header =====
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  setColumnHeader: {
    width: 45,
    textAlign: 'center',
  },
  weightColumnHeader: {
    flex: 1,
    textAlign: 'center',
    paddingLeft: 8,
  },
  repsColumnHeader: {
    flex: 1,
    textAlign: 'center',
  },
  actionColumnHeader: {
    width: 40,
  },

  // ==== Table Rows =====
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  setColumn: {
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  repsColumn: {
    flex: 1,
    paddingHorizontal: 4,
  },
  actionColumn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===== Inputs =====
  setText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
    color: colors.text.primary,
    textAlign: 'center',
    minWidth: 50,
  },
  unitText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginLeft: 2,
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
