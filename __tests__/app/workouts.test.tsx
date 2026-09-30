import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import WorkoutsScreen from '@/app/(tabs)/workouts';
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore';
import { useToastStore } from '@/store/toastStore';
import { WorkoutWithCountRow } from '@/types/training';

const workoutRow = (id: string, name: string): WorkoutWithCountRow => ({
  id,
  name,
  date: '2026-09-27',
  duration: null,
  notes: null,
  tags: null,
  completed: 0,
  template_id: null,
  display_order: 0,
  is_active: 0,
  is_favorite: 0,
  started_at: null,
  created_at: '2026-09-01T10:00:00.000Z',
  exercise_count: 3,
});

const mockDeleteWorkout = jest.fn<(id: string) => Promise<void>>();

jest.mock('@/providers/AppProvider', () => ({
  useApp: () => ({
    workoutService: {
      getAllWorkouts: async () => [workoutRow('w_active', 'FBW A')],
      deleteWorkout: mockDeleteWorkout,
    },
    weeklyPlanService: {
      getAllPlansWithDetails: async () => [],
      getActivePlan: async () => null,
    },
    presetService: { getPresetWorkouts: () => [] },
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useFocusEffect: (callback: () => void) => {
    // jest.mock factories are hoisted and cannot close over imports.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react').useEffect(callback, []);
  },
}));

jest.mock('@/hooks/useStartWorkout', () => ({
  useStartWorkout: () => jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn(), db: jest.fn() },
}));

describe('deleting the active workout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useToastStore.setState({ message: null, type: 'info' });
  });

  test('is blocked while its session is in progress', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    useActiveWorkoutStore.setState({ workoutId: 'w_active', exercises: null });
    render(<WorkoutsScreen />);

    fireEvent.press(await screen.findByLabelText('Usuń trening'), {
      stopPropagation: jest.fn(),
    });

    expect(useToastStore.getState().type).toBe('info');
    expect(useToastStore.getState().message).toMatch(/aktywny trening/);
    expect(alert).not.toHaveBeenCalled();
    expect(mockDeleteWorkout).not.toHaveBeenCalled();
  });

  test('asks for confirmation when another workout is active', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    useActiveWorkoutStore.setState({ workoutId: 'w_other', exercises: null });
    render(<WorkoutsScreen />);

    fireEvent.press(await screen.findByLabelText('Usuń trening'), {
      stopPropagation: jest.fn(),
    });

    expect(alert).toHaveBeenCalledTimes(1);
    expect(useToastStore.getState().message).toBeNull();
  });
});
