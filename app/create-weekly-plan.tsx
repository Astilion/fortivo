import { useApp } from '@/providers/AppProvider';
import { useState, useCallback, useEffect } from 'react';
import {
  useRouter,
  useFocusEffect,
  useLocalSearchParams,
  Stack,
} from 'expo-router';
import { useWeeklyPlanStore } from '@/store/weeklyPlanStore';
import colors from '@/constants/Colors';
import {
  View,
  ScrollView,
  Text,
  Alert,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
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
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;
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

  useEffect(() => {
    if (!isEditMode) return;

    const load = async () => {
      const plan = await weeklyPlanService.getWeeklyPlan(id);
      if (!plan) return;

      setPlanName(plan.name);
      setDays((prev) =>
        prev.map((day) => {
          const matchingDay = plan.days.find(
            (d) => d.dayOfWeek === day.dayOfWeek,
          );
          return matchingDay
            ? {
                ...day,
                workoutId: matchingDay.workout?.id ?? null,
                workoutName: matchingDay.workout?.name ?? null,
                isRestDay: matchingDay.isRestDay,
              }
            : day;
        }),
      );
    };
    load();
  }, [id]);

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
    if (isEditMode) {
      try {
        await weeklyPlanService.updateWeeklyPlan(id, planName);
        await weeklyPlanService.deleteAllPlanDays(id);

        const daysToUpdate = days.filter(
          (day) => day.workoutId !== null || day.isRestDay,
        );
        await Promise.all(
          daysToUpdate.map((day) =>
            weeklyPlanService.addWeeklyPlanDay(
              id,
              day.dayOfWeek,
              day.dayName,
              day.workoutId ?? undefined,
              day.isRestDay,
            ),
          ),
        );
        router.back();
      } catch (error) {
        logger.error('Błąd aktualizacji planu', error);
        Alert.alert('Błąd', 'Nie udało się zaktualizować planu');
        return;
      }
    } else {
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
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditMode ? 'Edytuj Plan Tygodniowy' : 'Nowy Plan Tygodniowy',
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <Input
          value={planName}
          onChangeText={setPlanName}
          placeholder='Nazwa planu'
        />

        <View style={styles.daysList}>
          {days.map((day, index) => (
            <View key={day.dayOfWeek} style={styles.dayCard}>
              <Text style={styles.dayName}>{day.dayName}</Text>

              {day.workoutId === null && !day.isRestDay && (
                <View style={styles.dayActions}>
                  <Pressable
                    style={styles.addWorkoutBtn}
                    onPress={() => handleAddWorkout(index)}
                  >
                    <Ionicons name='add' size={14} color={colors.primary} />
                    <Text style={styles.addWorkoutText}>Trening</Text>
                  </Pressable>
                  <Pressable
                    style={styles.restDayBtn}
                    onPress={() => handleToggleRestDay(index)}
                  >
                    <Ionicons
                      name='moon-outline'
                      size={13}
                      color={colors.text.secondary}
                    />
                    <Text style={styles.restDayText}>Odpoczynek</Text>
                  </Pressable>
                </View>
              )}

              {day.workoutId !== null && (
                <View style={styles.assignedPill}>
                  <Text style={styles.assignedWorkoutName} numberOfLines={1}>
                    {day.workoutName}
                  </Text>
                  <Pressable
                    onPress={() => handleDeleteWorkout(index)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name='close'
                      size={16}
                      color={colors.text.secondary}
                    />
                  </Pressable>
                </View>
              )}

              {day.isRestDay && (
                <View style={styles.assignedPill}>
                  <Ionicons
                    name='moon-outline'
                    size={13}
                    color={colors.text.secondary}
                  />
                  <Text style={styles.restDayLabel}>Odpoczynek</Text>
                  <Pressable
                    onPress={() => handleToggleRestDay(index)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name='close'
                      size={16}
                      color={colors.text.secondary}
                    />
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.saveButton}>
        <Button
          title={isEditMode ? 'Zapisz zmiany' : 'Zapisz plan'}
          variant='primary'
          onPress={handleSave}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  daysList: {
    gap: 8,
    marginTop: 16,
  },
  dayCard: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayName: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  dayActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  addWorkoutText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },
  restDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  restDayText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  assignedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    maxWidth: '60%',
  },
  assignedWorkoutName: {
    fontSize: 13,
    color: colors.accent,
    flexShrink: 1,
  },
  restDayLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  saveButton: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
  },
});
