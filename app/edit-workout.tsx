import { Button } from '@/components/ui/Button';
import { ExpandableExerciseCard } from '@/components/ui/ExpandableExerciseCard';
import { Input } from '@/components/ui/Input';
import { commonStyles } from '@/constants/Styles';
import colors from '@/constants/Colors';
import { useApp } from '@/providers/AppProvider';
import { useWorkoutStore } from '@/store/workoutStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

export default function EditWorkoutScreen() {
  const router = useRouter();
  const [showNameError, setShowNameError] = useState(false);
  const [showExercisesError, setShowExercisesError] = useState(false);
  
  const {
    draft,
    setWorkoutName,
    removeExercise,
    clearDraft,
    setExercises,
    toggleExpanded,
    addSet,
    removeSet,
    updateSet,
    moveExerciseDown,
    moveExerciseUp,
  } = useWorkoutStore();
  const { workoutService } = useApp();
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    loadWorkout();
  }, [id, workoutService]);

  const loadWorkout = useCallback(async () => {
    try {
      clearDraft();
      const workout = await workoutService.getWorkoutById(id);
      if (workout) {
        setWorkoutName(workout.name);
        const exercises = await workoutService.getWorkoutExercises(id);
        setExercises(exercises);
      }
    } catch (error) {
      console.error('Error loading workout:', error);
      Alert.alert('Błąd', 'Nie udało się załadować treningu');
    }
  }, [id, workoutService]);

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
      await workoutService.updateWorkout(id, { name: draft.name });
      await workoutService.saveWorkoutExercises(id, draft.exercises);
      clearDraft();
      router.back();
    } catch (error) {
      console.error('Błąd zapisu', error);
      Alert.alert('Błąd', 'Nie udało się zapisać treningu');
    }
  };

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={{ gap: 16, paddingBottom: 80 }}
    >
      <View>
        <Input
          value={draft.name}
          onChangeText={(text) => {
            setWorkoutName(text);
            if (showNameError) setShowNameError(false);
          }}
          placeholder='Nazwa treningu...'
        />
        {showNameError && (
          <Text style={{ 
            color: colors.danger, 
            fontSize: 12, 
            marginTop: 4,
            marginLeft: 4,
          }}>
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
              key={item.exercise.id}
              exerciseName={item.exercise.name}
              exerciseCategories={item.exercise.categories}
              exerciseId={item.exercise.id}
              measurementType={item.exercise.measurementType}
              sets={item.sets}
              isExpanded={item.isExpanded || false}
              onToggleExpand={() => toggleExpanded(item.exercise.id)}
              onRemoveExercise={() => removeExercise(item.exercise.id)}
              onAddSet={() => addSet(item.exercise.id)}
              onRemoveSet={(setId) => removeSet(item.exercise.id, setId)}
              onUpdateSet={(setId, updates) =>
                updateSet(item.exercise.id, setId, updates)
              }
              onMoveDown={() => moveExerciseDown(item.exercise.id)}
              onMoveUp={() => moveExerciseUp(item.exercise.id)}
              isFirst={index === 0}
              isLast={index === draft.exercises.length - 1}
            />
          ))}
        </>
      )}

      <Button
        title='+ Dodaj Ćwiczenie'
        onPress={() => {
          router.push('/select-exercise');
          if (showExercisesError) setShowExercisesError(false);
        }}
        variant='primary'
      />
      
      {showExercisesError && (
        <Text style={{ 
          color: colors.danger, 
          fontSize: 12, 
          marginTop: -8,
          marginLeft: 4,
        }}>
          Dodaj przynajmniej jedno ćwiczenie
        </Text>
      )}

      <Button
        title='Zapisz zmiany'
        onPress={handleSaveWorkout}
        variant='primary'
      />
    </ScrollView>
  );
}