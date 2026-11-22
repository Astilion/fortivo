import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ActiveWorkoutScreen from '@/app/active-workout';
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore';
import { WorkoutExerciseWithSets } from '@/types/training';

jest.mock('@/providers/AppProvider', () => ({
  useApp: () => ({ workoutService: {} }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useFocusEffect: jest.fn(),
}));

jest.mock('@/hooks/useProfileSettings', () => ({
  useProfileSettings: () => ({ settings: null }),
}));

jest.mock('@/hooks/useActiveWorkoutAutosave', () => ({
  useActiveWorkoutAutosave: jest.fn(),
}));

jest.mock('react-native-keyboard-controller', () =>
  // jest.mock factories are hoisted and cannot close over imports.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('react-native-keyboard-controller/jest'),
);

jest.mock('@/utils/logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn(), db: jest.fn() },
}));

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const session: WorkoutExerciseWithSets[] = [
  {
    id: 'we_1',
    exercise: {
      id: 'ex_1',
      name: 'Przysiad',
      categories: [],
      muscleGroups: [],
      measurementType: 'reps',
      isCustom: false,
      createdAt: new Date(2026, 8, 1),
    },
    sets: [
      {
        id: 'ws_1',
        reps: 8,
        weight: 50,
        completed: false,
        actualReps: 8,
        actualWeight: 50,
      },
    ],
  },
];

const appStateChangeHandler = () => {
  const call = jest
    .mocked(AppState.addEventListener)
    .mock.calls.find(([event]) => event === 'change');
  if (!call) throw new Error('AppState change listener not registered');
  return call[1] as (state: AppStateStatus) => void;
};

describe('leaving the app during an active workout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useActiveWorkoutStore.getState().reset();
    useActiveWorkoutStore.setState({ workoutId: 'w_1', exercises: session });
  });

  test('commits an unsubmitted value to the store synchronously', async () => {
    render(
      <SafeAreaProvider initialMetrics={METRICS}>
        <ActiveWorkoutScreen />
      </SafeAreaProvider>,
    );

    fireEvent.changeText(await screen.findByDisplayValue('50'), '62.5');
    act(() => appStateChangeHandler()('background'));

    expect(
      useActiveWorkoutStore.getState().exercises?.[0].sets[0].actualWeight,
    ).toBe(62.5);
  });
});
