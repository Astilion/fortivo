import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Alert } from 'react-native';
import ExercisesScreen from '@/app/(tabs)/exercises';
import { Exercise } from '@/services/exerciseService';
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore';
import { useExerciseStore } from '@/store/exerciseStore';
import { useToastStore } from '@/store/toastStore';
import { WorkoutExerciseWithSets } from '@/types/training';

const mockGetWorkoutExercises =
  jest.fn<(workoutId: string) => Promise<WorkoutExerciseWithSets[]>>();

jest.mock('@/providers/AppProvider', () => ({
  useApp: () => ({
    workoutService: { getWorkoutExercises: mockGetWorkoutExercises },
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useFocusEffect: jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn(), db: jest.fn() },
}));

const customExercise = (id: string): Exercise => ({
  id,
  name: `Własne ${id}`,
  categories: [],
  muscleGroups: [],
  measurementType: 'reps',
  isCustom: true,
  createdAt: new Date(2026, 8, 1),
});

const sessionWith = (exerciseId: string): WorkoutExerciseWithSets[] => [
  { id: 'we_1', exercise: customExercise(exerciseId), sets: [] },
];

const mockDeleteExercise = jest.fn<(id: string) => Promise<void>>();
const mockGetUsageCount = jest.fn<(id: string) => Promise<number>>();

const pressDelete = () =>
  fireEvent.press(screen.getByLabelText('Usuń ćwiczenie'), {
    stopPropagation: jest.fn(),
  });

describe('deleting an exercise during an active workout', () => {
  let alert: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();
    alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockGetUsageCount.mockResolvedValue(0);
    useExerciseStore.setState({
      exercises: [customExercise('ex_x')],
      loading: false,
      deleteExercise: mockDeleteExercise,
      getExerciseUsageCount: mockGetUsageCount,
    });
    useActiveWorkoutStore.getState().reset();
    useToastStore.setState({ message: null, type: 'info' });
  });

  test('is blocked when the in-memory session contains the exercise', async () => {
    useActiveWorkoutStore.setState({
      workoutId: 'w_1',
      exercises: sessionWith('ex_x'),
    });
    render(<ExercisesScreen />);

    pressDelete();

    await waitFor(() => expect(useToastStore.getState().type).toBe('info'));
    expect(useToastStore.getState().message).toMatch(/aktywnego treningu/);
    expect(alert).not.toHaveBeenCalled();
    expect(mockGetUsageCount).not.toHaveBeenCalled();
    expect(mockGetWorkoutExercises).not.toHaveBeenCalled();
    expect(mockDeleteExercise).not.toHaveBeenCalled();
  });

  test('is blocked after a cold start when the DB session contains the exercise', async () => {
    useActiveWorkoutStore.setState({ workoutId: 'w_1', exercises: null });
    mockGetWorkoutExercises.mockResolvedValue(sessionWith('ex_x'));
    render(<ExercisesScreen />);

    pressDelete();

    await waitFor(() =>
      expect(useToastStore.getState().message).toMatch(/aktywnego treningu/),
    );
    expect(mockGetWorkoutExercises).toHaveBeenCalledWith('w_1');
    expect(alert).not.toHaveBeenCalled();
    expect(mockDeleteExercise).not.toHaveBeenCalled();
  });

  test('asks for confirmation when the exercise is not in the session', async () => {
    useActiveWorkoutStore.setState({
      workoutId: 'w_1',
      exercises: sessionWith('ex_other'),
    });
    render(<ExercisesScreen />);

    pressDelete();

    await waitFor(() => expect(alert).toHaveBeenCalledTimes(1));
    expect(useToastStore.getState().message).toBeNull();
  });

  test('asks for confirmation when the DB session does not contain the exercise', async () => {
    useActiveWorkoutStore.setState({ workoutId: 'w_1', exercises: null });
    mockGetWorkoutExercises.mockResolvedValue(sessionWith('ex_other'));
    render(<ExercisesScreen />);

    pressDelete();

    await waitFor(() => expect(alert).toHaveBeenCalledTimes(1));
  });

  test('does not delete when the session cannot be read', async () => {
    useActiveWorkoutStore.setState({ workoutId: 'w_1', exercises: null });
    mockGetWorkoutExercises.mockRejectedValue(new Error('db'));
    render(<ExercisesScreen />);

    pressDelete();

    await waitFor(() => expect(useToastStore.getState().type).toBe('error'));
    expect(alert).not.toHaveBeenCalled();
    expect(mockDeleteExercise).not.toHaveBeenCalled();
  });
});
