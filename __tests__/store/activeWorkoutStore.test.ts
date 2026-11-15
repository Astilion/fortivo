import { beforeEach, describe, test, expect } from '@jest/globals';
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore';
import {
  Exercise,
  WorkoutExerciseWithSets,
  WorkoutSet,
} from '@/types/training';

const exercise = (measurementType: Exercise['measurementType']): Exercise => ({
  id: `ex_${measurementType}`,
  name: 'Ćwiczenie',
  categories: [],
  muscleGroups: [],
  measurementType,
  isCustom: false,
  createdAt: new Date(2026, 8, 1),
});

const workoutSet = (id: string, overrides: Partial<WorkoutSet> = {}) => ({
  id,
  reps: 8,
  completed: false,
  ...overrides,
});

const seed = (exercises: WorkoutExerciseWithSets[]) =>
  useActiveWorkoutStore.setState({
    workoutId: 'w_1',
    workoutStartTime: Date.now(),
    exercises,
  });

const setsOf = (exerciseId: string) =>
  useActiveWorkoutStore.getState().exercises?.find((ex) => ex.id === exerciseId)
    ?.sets ?? [];

const apply = (exerciseId: string, sourceSetId: string) =>
  useActiveWorkoutStore.getState().applySetToFollowing(exerciseId, sourceSetId);

describe('activeWorkoutStore.applySetToFollowing', () => {
  beforeEach(() => {
    useActiveWorkoutStore.getState().reset();
  });

  test('copies only to later uncompleted sets', () => {
    seed([
      {
        id: 'we_1',
        exercise: exercise('reps'),
        sets: [
          workoutSet('ws_1', { actualWeight: 50, actualReps: 8 }),
          workoutSet('ws_2', { actualWeight: 60, actualReps: 10 }),
          workoutSet('ws_3', {
            actualWeight: 55,
            actualReps: 6,
            completed: true,
          }),
          workoutSet('ws_4', { actualWeight: 50, actualReps: 8 }),
        ],
      },
    ]);

    expect(apply('we_1', 'ws_2')).toBe(1);

    const [first, , completed, last] = setsOf('we_1');
    expect(first).toMatchObject({ actualWeight: 50, actualReps: 8 });
    expect(completed).toMatchObject({ actualWeight: 55, actualReps: 6 });
    expect(last).toMatchObject({ actualWeight: 60, actualReps: 10 });
  });

  test('leaves RPE and tempo of targets untouched', () => {
    seed([
      {
        id: 'we_1',
        exercise: exercise('reps'),
        sets: [
          workoutSet('ws_1', {
            actualWeight: 60,
            actualReps: 10,
            actualRpe: 9,
            tempo: '3-1-2',
          }),
          workoutSet('ws_2', {
            actualWeight: 50,
            actualReps: 8,
            actualRpe: 7,
            tempo: '2-0-1',
          }),
        ],
      },
    ]);

    apply('we_1', 'ws_1');

    expect(setsOf('we_1')[1]).toMatchObject({
      actualWeight: 60,
      actualReps: 10,
      actualRpe: 7,
      tempo: '2-0-1',
    });
  });

  test('works from a completed source set', () => {
    seed([
      {
        id: 'we_1',
        exercise: exercise('reps'),
        sets: [
          workoutSet('ws_1', {
            actualWeight: 60,
            actualReps: 10,
            completed: true,
          }),
          workoutSet('ws_2', { actualWeight: 50, actualReps: 8 }),
        ],
      },
    ]);

    expect(apply('we_1', 'ws_1')).toBe(1);
    expect(setsOf('we_1')[1]).toMatchObject({
      actualWeight: 60,
      actualReps: 10,
      completed: false,
    });
  });

  test('copies a 0 kg weight', () => {
    seed([
      {
        id: 'we_1',
        exercise: exercise('reps'),
        sets: [
          workoutSet('ws_1', { actualWeight: 0, actualReps: 12 }),
          workoutSet('ws_2', { actualWeight: 20, actualReps: 12 }),
        ],
      },
    ]);

    expect(apply('we_1', 'ws_1')).toBe(1);
    expect(setsOf('we_1')[1].actualWeight).toBe(0);
  });

  test('copies duration, not reps, for timed exercises', () => {
    seed([
      {
        id: 'we_1',
        exercise: exercise('time'),
        sets: [
          workoutSet('ws_1', { actualWeight: 0, actualDuration: 60 }),
          workoutSet('ws_2', { actualWeight: 0, actualDuration: 30 }),
        ],
      },
    ]);

    expect(apply('we_1', 'ws_1')).toBe(1);
    const target = setsOf('we_1')[1];
    expect(target.actualDuration).toBe(60);
    expect(target).not.toHaveProperty('actualReps');
  });

  test('without targets returns 0 and keeps the state reference', () => {
    seed([
      {
        id: 'we_1',
        exercise: exercise('reps'),
        sets: [
          workoutSet('ws_1', { actualWeight: 60, actualReps: 10 }),
          workoutSet('ws_2', { actualWeight: 60, actualReps: 10 }),
          workoutSet('ws_3', {
            actualWeight: 40,
            actualReps: 5,
            completed: true,
          }),
        ],
      },
    ]);
    const before = useActiveWorkoutStore.getState().exercises;

    expect(apply('we_1', 'ws_1')).toBe(0);
    expect(useActiveWorkoutStore.getState().exercises).toBe(before);
  });
});
