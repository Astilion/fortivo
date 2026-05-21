export type PresetCategory = 'basic' | 'premium';

/** Exactly one of reps/duration/distance is set, matching the exercise's measurementType. */
export interface PresetWorkoutSet {
  setOrder: number;
  reps?: number;
  duration?: number; // seconds
  distance?: number; // meters
  rpe?: number;
  restTime?: number;
  tempo?: string;
  // Weight is intentionally absent — users add their own based on capability.
}

export interface PresetWorkoutExercise {
  exerciseId: string;
  order: number;
  notes?: string;
  sets: PresetWorkoutSet[];
}

export interface PresetWorkout {
  id: string;
  name: string;
  description?: string;
  category: PresetCategory;
  tags?: string[];
  estimatedDurationMinutes?: number;
  exercises: PresetWorkoutExercise[];
  coachingNotes?: string;
}

export interface PresetWeeklyPlanDay {
  dayOfWeek: number;
  presetWorkoutId?: string;
  isRestDay: boolean;
  customName?: string;
}

export interface PresetWeeklyPlan {
  id: string;
  name: string;
  description?: string;
  category: PresetCategory;
  tags?: string[];
  days: PresetWeeklyPlanDay[];
}
