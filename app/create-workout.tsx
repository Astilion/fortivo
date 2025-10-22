import { View, Text, ScrollView } from 'react-native';
import { useApp } from '@/providers/AppProvider';
import { useWorkoutStore } from '@/store/workoutStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { commonStyles } from '@/constants/Styles';
import { useRouter } from 'expo-router';
import { ExpandableExerciseCard } from '@/components/ui/ExpandableExerciseCard';

export default function CreateWorkoutScreen() {
  const router = useRouter();
  const {
    draft,
    setWorkoutName,
    removeExercise,
    clearDraft,
    toggleExpanded,
    addSet,
    removeSet,
    updateSet,
  } = useWorkoutStore();
  const { workoutService } = useApp();

  const handleSaveWorkout = async () => {
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
      alert('Trening zapisany!');
    } catch (error) {
      console.error('Błąd zapisu', error);
      alert('Nie udało się zapisać treningu');
    }
  };

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={{ gap: 16, paddingBottom: 80 }}
    >
      <Text style={commonStyles.title}>Utwórz nowy trening</Text>

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

          {draft.exercises.map((item) => (
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
        title='Zapisz Trening'
        onPress={handleSaveWorkout}
        variant='primary'
        disabled={!draft.name.trim() || draft.exercises.length === 0}
      />
    </ScrollView>
  );
}
