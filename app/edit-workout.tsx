import { Alert, Text, ScrollView } from 'react-native';
import { useEffect } from 'react';
import { useApp } from '@/providers/AppProvider';
import { useWorkoutStore } from '@/store/workoutStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { commonStyles } from '@/constants/Styles';
import { useRouter } from 'expo-router';
import { ExpandableExerciseCard } from '@/components/ui/ExpandableExerciseCard';
import { useLocalSearchParams } from 'expo-router';

export default function EditWorkoutScreen() {
  const router = useRouter();
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
  }, [id]);

  const loadWorkout = async () => {
    try {
      clearDraft();

      const workout = await workoutService.getWorkoutById(id);
      if (workout) {
        setWorkoutName(workout.name);
        const exercises = await workoutService.getWorkoutExercises(id);
        setExercises(exercises);
      }
    } catch (error) {
      console.error('Błąd ładowania:', error);
      Alert.alert('Błąd','Nie udało się załadować treningu');
    }
  };

  const handleSaveWorkout = async () => {
    try {
      await workoutService.updateWorkout(id, { name: draft.name });
      await workoutService.saveWorkoutExercises(id, draft.exercises);
      clearDraft();
      router.back();
      Alert.alert('Sukces','Zmiany zapisane!');
    } catch (error) {
      console.error('Błąd zapisu', error);
      Alert.alert('Błąd','Nie udało się zapisać treningu');
    }
  };

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={{ gap: 16, paddingBottom: 80 }}
    >
      <Text style={commonStyles.title}>Edytuj Trening</Text>

      <Input
        value={draft.name}
        onChangeText={setWorkoutName}
        placeholder='Nazwa treningu...'
      />

      {draft.exercises.length > 0 && (
        <>
          <Text style={commonStyles.subtitle}>
            Ćwiczenia ({draft.exercises.length}):
          </Text>

          {draft.exercises.map((item, index) => (
            <ExpandableExerciseCard
              key={item.exercise.id}
              exerciseName={item.exercise.name}
              exerciseCategory={item.exercise.category}
              exerciseId={item.exercise.id}
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
        onPress={() => router.push('/select-exercise')}
        variant='primary'
      />

      <Button
        title='Zapisz zmiany'
        onPress={handleSaveWorkout}
        variant='primary'
        disabled={!draft.name.trim() || draft.exercises.length === 0}
      />
    </ScrollView>
  );
}
