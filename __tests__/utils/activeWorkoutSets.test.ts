import { describe, test, expect } from '@jest/globals';
import { getFollowingSetUpdates } from '@/utils/activeWorkoutSets';
import {
  Exercise,
  WorkoutExerciseWithSets,
  WorkoutSet,
} from '@/types/training';

const exercise: Exercise = {
  id: 'ex_1',
  name: 'Przysiad',
  categories: [],
  muscleGroups: [],
  measurementType: 'reps',
  isCustom: false,
  createdAt: new Date(2026, 8, 1),
};

const workoutSet = (id: string, overrides: Partial<WorkoutSet> = {}) => ({
  id,
  reps: 8,
  completed: false,
  ...overrides,
});

const withSets = (sets: WorkoutSet[]): WorkoutExerciseWithSets => ({
  id: 'we_1',
  exercise,
  sets,
});

describe('getFollowingSetUpdates', () => {
  test('source without weight leaves target weight untouched', () => {
    const updates = getFollowingSetUpdates(
      withSets([
        workoutSet('ws_1', { actualWeight: undefined, actualReps: 10 }),
        workoutSet('ws_2', { actualWeight: 60, actualReps: 8 }),
      ]),
      'ws_1',
    );

    expect(updates).toEqual([{ setId: 'ws_2', updates: { actualReps: 10 } }]);
  });

  test('unknown source yields no updates', () => {
    const updates = getFollowingSetUpdates(
      withSets([workoutSet('ws_1', { actualWeight: 60, actualReps: 8 })]),
      'ws_missing',
    );

    expect(updates).toEqual([]);
  });
});
