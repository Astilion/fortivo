import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/providers/AppProvider';
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore';
import { useToastStore } from '@/store/toastStore';
import { ServiceError } from '@/utils/errors';
import { logger } from '@/utils/logger';

// Starts a workout. If another workout is already in progress, asks the user
// what to do instead of silently overwriting it. `onActivated` runs once the
// workout is active — the calling screen decides where to navigate.
export function useStartWorkout() {
  const { workoutService } = useApp();
  const { showToast } = useToastStore();
  const router = useRouter();

  const fail = useCallback(
    (error: unknown) => {
      logger.error('Failed to start workout', error);
      showToast(
        error instanceof ServiceError
          ? error.userMessage
          : 'Nie udało się uruchomić treningu',
        'error',
      );
    },
    [showToast],
  );

  return useCallback(
    async (workoutId: string, onActivated: () => void) => {
      try {
        const active = await workoutService.getActiveWorkout();

        // Nothing in progress — just start.
        if (!active) {
          await workoutService.setActiveWorkout(workoutId);
          onActivated();
          return;
        }

        // This same workout is already running — go back into it without
        // resetting the sets the user already filled in.
        if (active.id === workoutId) {
          onActivated();
          return;
        }

        // A different workout is in progress — let the user choose.
        Alert.alert(
          'Masz aktywny trening',
          'Zakończ go najpierw albo odrzuć, zanim zaczniesz nowy.',
          [
            { text: 'Anuluj', style: 'cancel' },
            {
              text: 'Przejdź do aktywnego',
              onPress: () => router.push('/active-workout'),
            },
            {
              text: 'Odrzuć i zacznij nowy',
              style: 'destructive',
              onPress: async () => {
                try {
                  // Discarded workout is not saved to history, so wipe its
                  // in-progress data before starting the new one.
                  await workoutService.discardActiveWorkout(active.id);
                  useActiveWorkoutStore.getState().reset();
                  await workoutService.setActiveWorkout(workoutId);
                  onActivated();
                } catch (error) {
                  fail(error);
                }
              },
            },
          ],
        );
      } catch (error) {
        fail(error);
      }
    },
    [workoutService, router, fail],
  );
}
