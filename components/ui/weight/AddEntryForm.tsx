import { StyleSheet, View, Text, TextInput, Pressable } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/Colors';

interface AddEntryFormProps {
  weightUnit: string;
  onAdd: (weight: number, notes?: string) => void;
}

export const AddEntryForm: React.FC<AddEntryFormProps> = ({
  weightUnit,
  onAdd,
}) => {
  const [weightInput, setWeightInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const weight = parseFloat(weightInput.replace(',', '.'));
    if (isNaN(weight) || weight < 35 || weight > 300) {
      setError('Wprowadź prawidłową wagę (35-300)');
      return;
    }
    onAdd(weight, notesInput || undefined);
    setWeightInput('');
    setNotesInput('');
    setError(null);
  };

  return (
    <View style={styles.addForm}>
      <Text style={styles.addFormTitle}>Dodaj wpis</Text>
      <View style={styles.addFormRow}>
        <View style={styles.addFormInputWrapper}>
          <TextInput
            style={styles.addFormInput}
            value={weightInput}
            onChangeText={setWeightInput}
            keyboardType='decimal-pad'
            placeholder='0.0'
            placeholderTextColor={colors.muted}
            maxLength={6}
          />
          <Text style={styles.addFormUnit}>{weightUnit}</Text>
        </View>

        <TextInput
          style={[styles.addFormInput, styles.addFormNotesInput]}
          value={notesInput}
          onChangeText={setNotesInput}
          placeholder='Notatka (opcjonalnie)'
          placeholderTextColor={colors.muted}
          maxLength={50}
        />

        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && { opacity: 0.8 },
          ]}
          onPress={handleAdd}
        >
          <Ionicons name='add' size={24} color={colors.primary} />
        </Pressable>
      </View>
      {error && <Text style={styles.addFormError}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  addForm: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.secondary,
    borderRadius: 14,
    padding: 16,
  },
  addFormTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  addFormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addFormInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  addFormInput: {
    fontSize: 15,
    color: colors.text.primary,
    minWidth: 48,
    textAlign: 'center',
  },
  addFormNotesInput: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: 'left',
  },
  addFormUnit: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  addFormError: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
});
