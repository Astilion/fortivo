import { View, Text,ScrollView } from 'react-native';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { commonStyles } from '@/constants/Styles';

export default function CreateWorkoutScreen() {
  const [workoutName, setWorkoutName] = useState<string>('');
  const [exercises, setExercises] = useState<string[]>([]);
  return (
    <ScrollView contentContainerStyle={{gap:16}} style={commonStyles.container}>
      <Text style={commonStyles.title}>Utwórz nowy trening</Text>
      <Input
        value={workoutName}
        onChangeText={setWorkoutName}
        placeholder='Nazwa treningu...'
      />
      <Button
        title='Dodaj Ćwiczenie'
        onPress={() => console.log('Dodaj Ćwiczenie')}
        variant='primary'
      />
      <Button
        title='Zapisz Trening'
        onPress={() => console.log('Zapisz:', workoutName)}
        variant='primary'
        disabled={!workoutName.trim()}
      />
    </ScrollView>
  );
}

