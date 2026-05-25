import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import colors from '@/constants/Colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/providers/AppProvider';
import { LOCAL_USER_ID } from '@/constants/User';
import { logger } from '@/utils/logger';
import { useToastStore } from '@/store/toastStore';
import { ServiceError } from '@/utils/errors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ExerciseForm {
  name: string;
  categories: string[];
  muscleGroups: string[];
  equipment: string[];
  difficulty: 'Początkujący' | 'Średniozaawansowany' | 'Zaawansowany' | '';
  instructions: string;
}

const EMPTY_FORM: ExerciseForm = {
  name: '',
  categories: [],
  muscleGroups: [],
  equipment: [],
  difficulty: '',
  instructions: '',
};

const EQUIPMENT_OPTIONS = [
  'Sztanga',
  'Hantle',
  'Maszyna',
  'Linka',
  'Kettle',
  'Guma',
  'Drążek',
  'Poręcze',
  'Bez sprzętu',
];

const DIFFICULTY_OPTIONS = [
  'Początkujący',
  'Średniozaawansowany',
  'Zaawansowany',
] as const;

export default function CreateExerciseScreen() {
  const [form, setForm] = useState<ExerciseForm>(EMPTY_FORM);
  const [categories, setCategories] = useState<string[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const { exerciseService } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToastStore();

  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;

  const initialize = useCallback(async () => {
    try {
      const [cats, muscles] = await Promise.all([
        exerciseService.getCategories(),
        exerciseService.getMuscleGroups(),
      ]);
      setCategories(cats);
      setMuscleGroups(muscles);

      if (isEditMode && id) {
        const exercise = await exerciseService.getExerciseById(id);
        if (!exercise) {
          showToast('Nie znaleziono ćwiczenia', 'error');
          router.back();
          return;
        }
        setForm({
          name: exercise.name,
          categories: exercise.categories,
          muscleGroups: exercise.muscleGroups,
          equipment: exercise.equipment ?? [],
          difficulty: exercise.difficulty ?? '',
          instructions: exercise.instructions ?? '',
        });
      }
    } catch (error) {
      logger.error('Failed to initialize create-exercise screen', error);
    } finally {
      setIsInitializing(false);
    }
    // showToast is a stable Zustand action; no need to re-create initialize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode, exerciseService, router]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const updateField = <K extends keyof ExerciseForm>(
    key: K,
    value: ExerciseForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayField = (
    field: 'categories' | 'muscleGroups' | 'equipment',
    value: string,
  ) => {
    setForm((prev) => {
      const current = prev[field];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      showToast('Nazwa ćwiczenia jest wymagana', 'error');
      return;
    }
    if (form.categories.length === 0) {
      showToast('Wybierz co najmniej jedną kategorię', 'error');
      return;
    }

    setIsLoading(true);
    try {
      if (isEditMode && id) {
        await exerciseService.updateExercise(
          id,
          {
            name: form.name.trim(),
            categories: form.categories,
            muscleGroups: form.muscleGroups,
            equipment: form.equipment,
            difficulty: form.difficulty || undefined,
            instructions: form.instructions.trim() || undefined,
          },
          LOCAL_USER_ID,
        );
      } else {
        await exerciseService.createExercise(
          {
            name: form.name.trim(),
            categories: form.categories,
            muscleGroups: form.muscleGroups,
            equipment: form.equipment,
            difficulty: form.difficulty || undefined,
            instructions: form.instructions.trim() || undefined,
            measurementType: 'reps',
          },
          LOCAL_USER_ID,
        );
      }
      showToast('Ćwiczenie zapisane', 'success');
      router.back();
    } catch (error) {
      logger.error('Failed to save exercise', error);
      if (error instanceof ServiceError) {
        showToast(error.userMessage, 'error');
      } else {
        showToast('Nie udało się zapisać ćwiczenia', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderChip = (
    label: string,
    isSelected: boolean,
    onPress: () => void,
  ) => (
    <Pressable
      key={label}
      style={[styles.chip, isSelected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );

  if (isInitializing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Ładowanie...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 40 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.section}>
        <Text style={styles.label}>
          Nazwa <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(text) => updateField('name', text)}
          placeholder="np. Wyciskanie sztangi"
          placeholderTextColor="#6C757D"
          maxLength={100}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>
          Kategoria <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.chipGrid}>
          {categories.map((cat) =>
            renderChip(cat, form.categories.includes(cat), () =>
              toggleArrayField('categories', cat),
            ),
          )}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Partie mięśniowe</Text>
        <View style={styles.chipGrid}>
          {muscleGroups.map((muscle) =>
            renderChip(muscle, form.muscleGroups.includes(muscle), () =>
              toggleArrayField('muscleGroups', muscle),
            ),
          )}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Sprzęt</Text>
        <View style={styles.chipGrid}>
          {EQUIPMENT_OPTIONS.map((eq) =>
            renderChip(eq, form.equipment.includes(eq), () =>
              toggleArrayField('equipment', eq),
            ),
          )}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Poziom trudności</Text>
        <View style={styles.chipGrid}>
          {DIFFICULTY_OPTIONS.map((diff) =>
            renderChip(diff, form.difficulty === diff, () =>
              updateField('difficulty', form.difficulty === diff ? '' : diff),
            ),
          )}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Instrukcje (opcjonalnie)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.instructions}
          onChangeText={(text) => updateField('instructions', text)}
          placeholder="Opisz technikę wykonania..."
          placeholderTextColor="#6C757D"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
      <Pressable
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={styles.submitText}>
          {isLoading
            ? 'Zapisywanie...'
            : isEditMode
              ? 'Zapisz zmiany'
              : 'Utwórz ćwiczenie'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  required: {
    color: colors.accent,
  },
  input: {
    backgroundColor: colors.secondary,
    color: colors.text.primary,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.background,
  },
  textArea: {
    minHeight: 100,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.background,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
