import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { UNKNOWN_DURATION } from '@/constants/activeWorkout';
import { hasCompletedSets, WorkoutService } from '@/services/workoutService';
import {
  PerformanceSnapshot,
  WorkoutExerciseWithSets,
  WorkoutSet,
} from '@/types/training';

const mockDb = {
  getFirstAsync: jest.fn<(...args: any[]) => Promise<any>>(),
  getAllAsync: jest.fn<(...args: any[]) => Promise<any>>(),
  runAsync: jest.fn<(...args: any[]) => Promise<any>>(),
  withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
};

const service = new WorkoutService(mockDb as any);

const STARTED_AT = '2026-09-20T16:00:00.000Z';

const set = (completed: boolean): WorkoutSet => ({
  id: `ws_${Math.random()}`,
  reps: 10,
  weight: 100,
  completed,
  actualReps: 10,
  actualWeight: 100,
});

const exercise = (sets: WorkoutSet[]): WorkoutExerciseWithSets => ({
  id: 'we_1',
  exercise: {
    id: 'ex_1',
    name: 'Przysiad',
    categories: [],
    muscleGroups: [],
    measurementType: 'reps',
    isCustom: false,
    createdAt: new Date(STARTED_AT),
  },
  sets,
});

const sqlCalls = () =>
  mockDb.runAsync.mock.calls.map(([sql]) => String(sql).replace(/\s+/g, ' '));

const indexOfSql = (fragment: string) =>
  sqlCalls().findIndex((sql) => sql.includes(fragment));

const mockActiveWorkout = (isActive = 1) =>
  mockDb.getFirstAsync.mockResolvedValueOnce({
    name: 'FBW A',
    started_at: STARTED_AT,
    is_active: isActive,
  });

describe('hasCompletedSets', () => {
  test('is true when at least one set was completed', () => {
    expect(hasCompletedSets([exercise([set(false), set(true)])])).toBe(true);
  });

  test('is false when no set was completed', () => {
    expect(hasCompletedSets([exercise([set(false), set(false)])])).toBe(false);
  });

  test('is false for an empty session', () => {
    expect(hasCompletedSets([])).toBe(false);
  });
});

describe('resolveStaleActiveWorkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test('archives a session with completed sets, then deactivates it', async () => {
    mockActiveWorkout();
    jest
      .spyOn(service, 'getWorkoutExercises')
      .mockResolvedValue([exercise([set(true), set(false)])]);

    const outcome = await service.resolveStaleActiveWorkout('workout_1');

    expect(outcome).toBe('archived');

    const historyCall = mockDb.runAsync.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO workout_history'),
    );
    const params = historyCall?.[1] as unknown[];
    expect(params[4]).toBe(STARTED_AT);
    expect(params[5]).toBe(UNKNOWN_DURATION);

    const historyIdx = indexOfSql('INSERT INTO workout_history');
    const progressIdx = indexOfSql('INSERT INTO exercise_progress');
    const deactivateIdx = indexOfSql(
      'UPDATE workouts SET is_active = 0, started_at = NULL',
    );
    expect(historyIdx).toBeGreaterThanOrEqual(0);
    expect(progressIdx).toBeGreaterThan(historyIdx);
    expect(deactivateIdx).toBeGreaterThan(progressIdx);
    expect(indexOfSql('UPDATE workout_sets')).toBe(-1);
  });

  test('clears a session with no completed sets', async () => {
    mockActiveWorkout();
    jest
      .spyOn(service, 'getWorkoutExercises')
      .mockResolvedValue([exercise([set(false), set(false)])]);

    const outcome = await service.resolveStaleActiveWorkout('workout_1');

    expect(outcome).toBe('cleared');
    expect(indexOfSql('INSERT INTO workout_history')).toBe(-1);
    expect(indexOfSql('UPDATE workout_sets')).toBeGreaterThanOrEqual(0);
    expect(
      indexOfSql('UPDATE workouts SET is_active = 0, started_at = NULL'),
    ).toBeGreaterThanOrEqual(0);
  });

  test('writes nothing when the workout is no longer active', async () => {
    mockActiveWorkout(0);
    const spy = jest.spyOn(service, 'getWorkoutExercises');

    const outcome = await service.resolveStaleActiveWorkout('workout_1');

    expect(outcome).toBe('cleared');
    expect(spy).not.toHaveBeenCalled();
    expect(mockDb.runAsync).not.toHaveBeenCalled();
  });

  test('finishWorkout ends in the same deactivation as the archive path', async () => {
    mockActiveWorkout();
    mockDb.getFirstAsync.mockResolvedValueOnce(null);

    await service.finishWorkout('workout_1', [exercise([set(true)])]);

    const calls = sqlCalls();
    expect(calls[calls.length - 1]).toContain(
      'UPDATE workouts SET is_active = 0, started_at = NULL',
    );
    expect(indexOfSql('SET actual_reps = NULL')).toBe(-1);
  });
});

describe('getCompletedWorkoutsThisWeek', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('maps unknown duration to null', async () => {
    const row = (id: string, actualDuration: number) => ({
      id,
      workout_id: 'workout_1',
      workout_name: 'FBW A',
      user_id: 'local_user',
      completed_at: STARTED_AT,
      actual_duration: actualDuration,
      performance_notes: null,
      performance_data: null,
    });
    mockDb.getAllAsync.mockResolvedValueOnce([
      row('wh_1', UNKNOWN_DURATION),
      row('wh_2', 45),
    ]);

    const rows = await service.getCompletedWorkoutsThisWeek(1);

    expect(rows.map((r) => r.actual_duration)).toEqual([null, 45]);
  });
});

describe('getWorkoutHistoryDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('counts volume only from completed sets and hides unknown duration', async () => {
    const snapshot: PerformanceSnapshot = {
      version: 1,
      exercises: [
        {
          exerciseId: 'ex_1',
          name: 'Przysiad',
          measurementType: 'reps',
          sets: [true, true, false, false].map((completed) => ({
            completed,
            reps: 10,
            weight: 100,
            rpe: null,
            tempo: null,
            duration: null,
            distance: null,
            actualReps: 10,
            actualWeight: 100,
            actualRpe: null,
            actualDuration: null,
            actualDistance: null,
          })),
        },
      ],
    };
    mockDb.getFirstAsync.mockResolvedValueOnce({
      id: 'wh_1',
      workout_id: 'workout_1',
      workout_name: 'FBW A',
      user_id: 'local_user',
      completed_at: STARTED_AT,
      actual_duration: UNKNOWN_DURATION,
      performance_notes: null,
      performance_data: JSON.stringify(snapshot),
    });

    const details = await service.getWorkoutHistoryDetails('wh_1');

    expect(details.stats.totalVolume).toBe(2000);
    expect(details.stats.completedSets).toBe(2);
    expect(details.stats.totalSets).toBe(4);
    expect(details.actualDuration).toBeNull();
  });
});
