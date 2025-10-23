import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/Colors';
import { Button } from './Button';
import { WorkoutSet } from '@/types/training';

interface ExpandableExerciseCardProps {
  exerciseName: string;
  exerciseCategory: string;
  exerciseId: string;
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
  exerciseCategory,
  exerciseId,
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
            <Text style={styles.exerciseCategory}>{exerciseCategory}</Text>
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
              Powtórzenia
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

              {/* Weight Input */}
              <View style={styles.weightColumn}>
                <TextInput
                  style={styles.input}
                  value={set.weight?.toString() || '0'}
                  onChangeText={(text) => {
                    const weight = parseFloat(text) || 0;
                    onUpdateSet(set.id, { weight });
                  }}
                  keyboardType='numeric'
                  placeholder='0'
                  placeholderTextColor={colors.text.secondary}
                />
                <Text style={styles.unitText}>kg</Text>
              </View>

              {/* Reps Input */}
              <View style={styles.repsColumn}>
                <TextInput
                  style={styles.input}
                  value={set.reps?.toString() || '8'}
                  onChangeText={(text) => {
                    const reps = parseInt(text) || 0;
                    onUpdateSet(set.id, { reps });
                  }}
                  keyboardType='numeric'
                  placeholder='8'
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
  exerciseCategory: {
    fontSize: 14,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },

  // NEW: Header actions container
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
