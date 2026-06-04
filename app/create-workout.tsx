import { Button } from '@/components/ui/Button';
import { ExpandableExerciseCard } from '@/components/ui/ExpandableExerciseCard';
import { Input } from '@/components/ui/Input';
import { commonStyles } from '@/constants/Styles';
import colors from '@/constants/Colors';
import { useApp } from '@/providers/AppProvider';
import { useProfileSettings } from '@/hooks/useProfileSettings';
import { useWorkoutStore } from '@/store/workoutStore';
import { useToastStore } from '@/store/toastStore';
import { ServiceError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { confirmAction } from '@/utils/confirm';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CreateWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToastStore();
  const [showNameError, setShowNameError] = useState(false);
  const [showExercisesError, setShowExercisesError] = useState(false);

  const {
    draft,
    setWorkoutName,
    removeExercise,
    clearDraft,
    toggleExpanded,
    addSet,
    removeSet,
    updateSet,
    moveExerciseDown,
    moveExerciseUp,
  } = useWorkoutStore();
  const { workoutService } = useApp();
  const { settings } = useProfileSettings();

  // Reset the draft once when entering the create flow; clearDraft is a
  // stable Zustand action.
  useEffect(() => {
    clearDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleSaveWorkout = async () => {
    setShowNameError(false);
    setShowExercisesError(false);

    if (!draft.name.trim()) {
      setShowNameError(true);
      return;
    }

    if (draft.exercises.length === 0) {
      setShowExercisesError(true);
      return;
    }

    try {
      const workoutData = {
        name: draft.name,
        date: new Date(),
        duration: undefined,
        notes: undefined,
        tags: undefined,
        completed: false,
        templateId: undefined,
      };
      const savedWorkout = await workoutService.createWorkout(workoutData);
      if (draft.exercises.length > 0) {
        await workoutService.saveWorkoutExercises(
          savedWorkout.id,
          draft.exercises,
        );
      }
      clearDraft();
      router.back();
    } catch (error) {
      logger.error('Błąd zapisu treningu', error);
      if (error instanceof ServiceError) {
        showToast(error.userMessage, 'error');
      } else {
        showToast('Nie udało się zapisać treningu', 'error');
      }
    }
  };

  return (
    <KeyboardAwareScrollView
      style={commonStyles.container}
      contentContainerStyle={{ gap: 16, paddingBottom: insets.bottom + 80 }}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >
      <View>
        <Input
          value={draft.name}
          onChangeText={(text) => {
            setWorkoutName(text);
            if (showNameError) setShowNameError(false);
          }}
          placeholder="Nazwa treningu..."
        />
        {showNameError && (
          <Text
            style={{
              color: colors.danger,
              fontSize: 12,
              marginTop: 4,
              marginLeft: 4,
            }}
          >
            Podaj nazwę treningu aby kontynuować
          </Text>
        )}
      </View>

      {draft.exercises.length > 0 && (
        <>
          <Text style={commonStyles.subtitle}>
            Ćwiczenia ({draft.exercises.length}):
          </Text>
          {draft.exercises.map((item, index) => (
            <ExpandableExerciseCard
              key={item.id}
              exerciseName={item.exercise.name}
              exerciseCategories={item.exercise.categories}
              measurementType={item.exercise.measurementType}
              weightUnit={settings?.preferredWeightUnit ?? 'kg'}
              trackRPE={settings?.trackRPE ?? false}
              trackTempo={settings?.trackTempo ?? false}
              trackRestTime={settings?.trackRestTime ?? false}
              sets={item.sets}
              isExpanded={item.isExpanded || false}
              onToggleExpand={() => toggleExpanded(item.id)}
              onRemoveExercise={() =>
                confirmAction(
                  'Usuń ćwiczenie',
                  `Czy na pewno chcesz usunąć "${item.exercise.name}"?`,
                  () => removeExercise(item.id),
                )
              }
              onAddSet={() => addSet(item.id)}
              onRemoveSet={(setId) => removeSet(item.id, setId)}
              onUpdateSet={(setId, updates) =>
                updateSet(item.id, setId, updates)
              }
              onMoveDown={() => moveExerciseDown(item.id)}
              onMoveUp={() => moveExerciseUp(item.id)}
              isFirst={index === 0}
              isLast={index === draft.exercises.length - 1}
            />
          ))}
        </>
      )}

      <Button
        title="+ Dodaj Ćwiczenie"
        onPress={() => {
          router.push('/select-exercise');
          if (showExercisesError) setShowExercisesError(false);
        }}
        variant="primary"
      />

      {showExercisesError && (
        <Text
          style={{
            color: colors.danger,
            fontSize: 12,
            marginTop: -8,
            marginLeft: 4,
          }}
        >
          Dodaj przynajmniej jedno ćwiczenie
        </Text>
      )}

      <Button
        title="Zapisz Trening"
        onPress={handleSaveWorkout}
        variant="primary"
      />
    </KeyboardAwareScrollView>
  );
}
