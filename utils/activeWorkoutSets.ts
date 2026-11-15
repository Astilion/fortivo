import {
  Exercise,
  WorkoutExerciseWithSets,
  WorkoutSet,
} from '@/types/training';

export type MeasurementType = Exercise['measurementType'];

export type FollowingSetUpdate = {
  setId: string;
  updates: Partial<WorkoutSet>;
};

export const getActualValue = (
  set: WorkoutSet,
  measurementType?: MeasurementType,
): number | undefined => {
  switch (measurementType) {
    case 'time':
      return set.actualDuration;
    case 'distance':
      return set.actualDistance;
    default:
      return set.actualReps;
  }
};

export const buildActualUpdate = (
  measurementType: MeasurementType | undefined,
  value: number,
): Partial<WorkoutSet> => {
  switch (measurementType) {
    case 'time':
      return { actualDuration: value };
    case 'distance':
      return { actualDistance: value };
    default:
      return { actualReps: value };
  }
};

export const getFollowingSetUpdates = (
  exercise: WorkoutExerciseWithSets,
  sourceSetId: string,
): FollowingSetUpdate[] => {
  const sourceIndex = exercise.sets.findIndex((s) => s.id === sourceSetId);
  if (sourceIndex === -1) return [];

  const source = exercise.sets[sourceIndex];
  const measurementType = exercise.exercise.measurementType;
  const sourceValue = getActualValue(source, measurementType);

  // An empty source field shows as blank — copying it would wipe the target.
  const copied: Partial<WorkoutSet> = {
    ...(source.actualWeight !== undefined
      ? { actualWeight: source.actualWeight }
      : {}),
    ...(sourceValue !== undefined
      ? buildActualUpdate(measurementType, sourceValue)
      : {}),
  };
  const copiedKeys = Object.keys(copied) as (keyof WorkoutSet)[];

  return exercise.sets
    .slice(sourceIndex + 1)
    .filter(
      (s) => !s.completed && copiedKeys.some((key) => s[key] !== copied[key]),
    )
    .map((s) => ({ setId: s.id, updates: copied }));
};
