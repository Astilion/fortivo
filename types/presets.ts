// Preset workouts (v0.5 launch)
export type PresetCategory = 'basic' | 'premium';

export interface PresetWorkoutSet {
  setOrder: number;
  reps: number;
  rpe?: number;
  restTime?: number; // seconds
  tempo?: string;
  // Weight is intentionally absent — users add their own based on capability.
}

export interface PresetWorkoutExercise {
  exerciseId: string; // references existing exercises.id
  order: number;
  notes?: string;
  sets: PresetWorkoutSet[];
}

export interface PresetWorkout {
  id: string; // e.g. 'preset_workout_fbw_basic'
  name: string;
  description?: string;
  category: PresetCategory;
  tags?: string[];
  estimatedDurationMinutes?: number;
  exercises: PresetWorkoutExercise[];
}

// Preset weekly plans — reserved for M2.1, do NOT implement service or UI for these now
export interface PresetWeeklyPlanDay {
  dayOfWeek: number; // 0-6
  presetWorkoutId?: string; // ref to PresetWorkout
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
