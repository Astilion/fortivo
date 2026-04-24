import { useApp } from '@/providers/AppProvider';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useWeeklyPlanStore } from '@/store/weeklyPlanStore';
import colors from '@/constants/Colors';
import {
  View,
  ScrollView,
  TextInput,
  Text,
  Alert,
  StyleSheet,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { logger } from '@/utils/logger';

type DayConfig = {
  dayOfWeek: number;
  dayName: string;
  workoutId: string | null;
  workoutName: string | null;
  isRestDay: boolean;
};
export default function CreateWeeklyPlanScreen() {
  const { weeklyPlanService } = useApp();
  const router = useRouter();
  const { pendingWorkout, clearPendingWorkout } = useWeeklyPlanStore();

  const [planName, setPlanName] = useState('');

  const [pendingDayIndex, setPendingDayIndex] = useState<number | null>(null);
  const [days, setDays] = useState<DayConfig[]>([
    {
      dayOfWeek: 1,
      dayName: 'Poniedziałek',
      workoutId: null,
      workoutName: null,
      isRestDay: false,
    },
    {
      dayOfWeek: 2,
      dayName: 'Wtorek',
      workoutId: null,
      workoutName: null,
      isRestDay: false,
    },
    {
      dayOfWeek: 3,
      dayName: 'Środa',
      workoutId: null,
      workoutName: null,
      isRestDay: false,
    },
    {
      dayOfWeek: 4,
      dayName: 'Czwartek',
      workoutId: null,
      workoutName: null,
      isRestDay: false,
    },
    {
      dayOfWeek: 5,
      dayName: 'Piątek',
      workoutId: null,
      workoutName: null,
      isRestDay: false,
    },
    {
      dayOfWeek: 6,
      dayName: 'Sobota',
      workoutId: null,
      workoutName: null,
      isRestDay: false,
    },
    {
      dayOfWeek: 0,
      dayName: 'Niedziela',
      workoutId: null,
      workoutName: null,
      isRestDay: false,
    },
  ]);
  const handleAddWorkout = (dayIndex: number) => {
    setPendingDayIndex(dayIndex);
    router.push('/select-workout');
  };

  useFocusEffect(
    useCallback(() => {
      if (pendingWorkout && pendingDayIndex !== null) {
        setDays((prev) =>
          prev.map((day, index) =>
            index === pendingDayIndex
              ? {
                  ...day,
                  workoutId: pendingWorkout.id,
                  workoutName: pendingWorkout.name,
                  isRestDay: false,
                }
              : day,
          ),
        );
        clearPendingWorkout();
        setPendingDayIndex(null);
      }
    }, [pendingWorkout, pendingDayIndex]),
  );

  const handleToggleRestDay = (dayIndex: number) => {
    setDays((prev) =>
      prev.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              isRestDay: !day.isRestDay,
              workoutId: null,
              workoutName: null,
            }
          : day,
      ),
    );
  };

  const handleDeleteWorkout = (dayIndex: number) => {
    setDays((prev) =>
      prev.map((day, index) =>
        index === dayIndex
          ? { ...day, workoutId: null, workoutName: null }
          : day,
      ),
    );
  };

  const handleSave = async () => {
    if (!planName.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę planu');
      return;
    }
    try {
      const planRow = await weeklyPlanService.createWeeklyPlan(planName);

      const daysToAdd = days.filter(
        (day) => day.workoutId !== null || day.isRestDay,
      );
      await Promise.all(
        daysToAdd.map((day) =>
          weeklyPlanService.addWeeklyPlanDay(
            planRow.id,
            day.dayOfWeek,
            day.dayName,
            day.workoutId ?? undefined,
            day.isRestDay,
          ),
        ),
      );
      router.back();
    } catch (error) {
      logger.error('Błąd zapisu planu', error);
      Alert.alert('Błąd', 'Nie udało się zapisać planu');
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.nameInput}
        placeholderTextColor={colors.text.secondary}
        value={planName}
        onChangeText={setPlanName}
        placeholder='Nazwa planu'
      />

      {days.map((day, index) => (
        <View key={day.dayOfWeek} style={styles.dayCard}>
          <Text style={styles.dayName}>{day.dayName}</Text>

          {day.workoutId === null && !day.isRestDay && (
            <View style={styles.buttonRow}>
              <View style={styles.buttonFlex}>
                <Button
                  title='Dodaj trening'
                  onPress={() => handleAddWorkout(index)}
                />
              </View>
              <View style={styles.buttonFlex}>
                <Button
                  title='Odpoczynek'
                  onPress={() => handleToggleRestDay(index)}
                />
              </View>
            </View>
          )}

          {day.workoutId !== null && (
            <Button
              title={`Usuń: ${day.workoutName}`}
              variant='secondary'
              onPress={() => handleDeleteWorkout(index)}
            />
          )}

          {day.isRestDay && (
            <Button
              title='Usuń odpoczynek'
              variant='secondary'
              onPress={() => handleToggleRestDay(index)}
            />
          )}
        </View>
      ))}

      <View style={styles.saveButton}>
        <Button title='Zapisz plan' variant='primary' onPress={handleSave} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  nameInput: {
    backgroundColor: colors.secondary,
    color: colors.text.primary,
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  dayCard: {
    backgroundColor: colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  dayName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignContent: 'center',
  },
  buttonFlex: {
    flex: 1,
    transform: [{ scale: 0.85 }],
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 40,
  },
});
