import { View, Text, ScrollView, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { useApp } from '@/providers/AppProvider';
import { useWorkoutStore } from '@/store/workoutStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { commonStyles } from '@/constants/Styles';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import colors from '@/constants/Colors';
import { useLocalSearchParams } from 'expo-router';

export default function EditWorkoutScreen() {
  const router = useRouter();
  const { draft, setWorkoutName, removeExercise, clearDraft, setExercises } =
    useWorkoutStore();
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
      alert('Nie udało się załadować treningu');
    }
  };

  const handleSaveWorkout = async () => {
    try {
      await workoutService.updateWorkout(id, { name: draft.name });
      await workoutService.saveWorkoutExercises(id, draft.exercises);
      clearDraft();
      router.back();
      alert('Zmiany zapisane!');
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
      <Text style={commonStyles.title}> Edytuj Trening</Text>

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

          {draft.exercises.map((exercise) => (
            <Card key={exercise.id}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: colors.text.primary, fontWeight: 'bold' }}
                  >
                    {exercise.name}
                  </Text>
                  <Text style={{ color: colors.text.secondary }}>
                    {exercise.category}
                  </Text>
                </View>
                <Button
                  title='Usuń'
                  variant='danger'
                  onPress={() => removeExercise(exercise.id)}
                />
              </View>
            </Card>
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
