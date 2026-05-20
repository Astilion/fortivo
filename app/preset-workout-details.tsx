import { Button } from '@/components/ui/Button';
import colors from '@/constants/Colors';
import { useApp } from '@/providers/AppProvider';
import { useExerciseStore } from '@/store/exerciseStore';
import { useToastStore } from '@/store/toastStore';
import { PresetWorkout, PresetWorkoutSet } from '@/types/presets';
import { ServiceError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const formatSetsSummary = (sets: PresetWorkoutSet[]): string => {
  if (sets.length === 0) return 'Brak serii';

  const reps = sets.map((s) => s.reps);
  const minReps = Math.min(...reps);
  const maxReps = Math.max(...reps);
  const repsLabel =
    minReps === maxReps ? `${minReps}` : `${minReps}-${maxReps}`;

  const parts: string[] = [`${sets.length} × ${repsLabel}`];

  const rpes = sets
    .map((s) => s.rpe)
    .filter((v): v is number => v !== undefined);
  if (rpes.length > 0) {
    const minRpe = Math.min(...rpes);
    const maxRpe = Math.max(...rpes);
    const rpeLabel = minRpe === maxRpe ? `${minRpe}` : `${minRpe}-${maxRpe}`;
    parts.push(`@ RPE ${rpeLabel}`);
  }

  const rests = sets
    .map((s) => s.restTime)
    .filter((v): v is number => v !== undefined);
  if (rests.length > 0) {
    const minRest = Math.min(...rests);
    const maxRest = Math.max(...rests);
    const restLabel =
      minRest === maxRest ? `${minRest}s` : `${minRest}-${maxRest}s`;
    parts.push(`${restLabel} odpoczynku`);
  }

  const tempos = Array.from(
    new Set(sets.map((s) => s.tempo).filter((v): v is string => Boolean(v))),
  );
  if (tempos.length === 1) {
    parts.push(`tempo ${tempos[0]}`);
  }

  return parts.join(', ');
};

export default function PresetWorkoutDetailsScreen() {
  const { presetId } = useLocalSearchParams<{ presetId: string }>();
  const { presetService } = useApp();
  const router = useRouter();
  const { showToast } = useToastStore();
  const exercises = useExerciseStore((state) => state.exercises);
  const [isCopying, setIsCopying] = useState(false);

  const preset: PresetWorkout | null = useMemo(
    () => (presetId ? presetService.getPresetWorkoutById(presetId) : null),
    [presetId, presetService],
  );

  const exerciseNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const ex of exercises) map.set(ex.id, ex.name);
    return map;
  }, [exercises]);

  const handleCopy = async () => {
    if (!preset) return;
    setIsCopying(true);
    try {
      await presetService.copyPresetWorkoutToUserWorkouts(preset.id);
      showToast('Trening dodany do twoich treningów', 'success');
      router.back();
    } catch (error) {
      logger.error('Copy preset failed', error);
      if (error instanceof ServiceError) {
        showToast(error.userMessage, 'error');
      } else {
        showToast('Nie udało się dodać treningu', 'error');
      }
    } finally {
      setIsCopying(false);
    }
  };

  if (!preset) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Nie znaleziono gotowego treningu</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>{preset.name}</Text>

        {preset.description && (
          <Text style={styles.description}>{preset.description}</Text>
        )}

        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {preset.exercises.length}{' '}
            {preset.exercises.length === 1 ? 'ćwiczenie' : 'ćwiczeń'}
          </Text>
          {preset.estimatedDurationMinutes !== undefined && (
            <>
              <Text style={styles.metaSeparator}>·</Text>
              <Text style={styles.meta}>
                ~{preset.estimatedDurationMinutes} min
              </Text>
            </>
          )}
        </View>

        {preset.exercises.map((presetExercise, index) => {
          const name =
            exerciseNameById.get(presetExercise.exerciseId) ??
            presetExercise.exerciseId;

          return (
            <View
              key={`${presetExercise.exerciseId}-${presetExercise.order}`}
              style={styles.exerciseBlock}
            >
              <Text style={styles.exerciseName}>
                {index + 1}. {name}
              </Text>
              <Text style={styles.setsSummary}>
                {formatSetsSummary(presetExercise.sets)}
              </Text>
              {presetExercise.notes && (
                <Text style={styles.exerciseNotes}>{presetExercise.notes}</Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isCopying ? 'Dodawanie...' : 'Dodaj do moich treningów'}
          variant="primary"
          onPress={handleCopy}
          disabled={isCopying}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  meta: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  metaSeparator: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  exerciseBlock: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 6,
  },
  setsSummary: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  exerciseNotes: {
    marginTop: 8,
    fontSize: 13,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
    backgroundColor: colors.primary,
  },
});
