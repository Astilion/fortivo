// Exercise Database
export interface Exercise {
  id: string;
  name: string;
  categories: string[];
  muscleGroups: string[];
  instructions?: string;
  equipment?: string[];
  difficulty?: 'Początkujący' | 'Średniozaawansowany' | 'Zaawansowany';
  measurementType?: 'reps' | 'time' | 'distance';
  duration?: number; // in seconds, for time-based exercises
  distance?: number; // in meters, for distance-based exercises
  isCustom: boolean;
  userId?: string; // Only for custom exercises
  createdAt: Date;
  photo?: string;
  video?: string;
}

// Workout set & exercise
export interface WorkoutSet {
  id: string;
  reps: number;
  weight?: number;
  rpe?: number;
  tempo?: string; // e.g., "3-1-2-0" (eccentric-pause-concentric-pause)
  restTime?: number;
  completed: boolean;
  notes?: string;
  actualReps?: number; // Track what was actually done vs planned
  actualWeight?: number;
  actualRpe?: number;
  duration?: number; // in seconds
  actualDuration?: number;
  distance?: number; // in meters
  actualDistance?: number;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  order: number;
  supersetGroup?: string; // Group exercises into supersets/circuits
  notes?: string;
}

// Single session
export interface Workout {
  id: string;
  name: string;
  date: Date;
  exercises: WorkoutExercise[];
  duration?: number; // in minutes
  notes?: string;
  tags?: string[]; // e.g., ['push', 'upper', 'strength']
  completed: boolean;
  templateId?: string; // Reference to template if created from one
}

// Weekly Plan
export interface WeeklyPlanDay {
  id: string;
  dayOfWeek: number;
  dayName?: string; // Optional custom name like "Push Day A"
  workout: Workout;
  isRestDay: boolean;
}

export interface WeeklyPlan {
  id: string;
  name: string;
  days: WeeklyPlanDay[];
  weekNumber?: number; // For periodization tracking
  createdAt: Date;
  notes?: string;
}

// Training Plan
export interface TrainingPlanWeek {
  id: string;
  weekNumber: number;
  weeklyPlan: WeeklyPlan;
  notes?: string;
  // Periodization variables
  intensityMultiplier?: number; // e.g., 0.9 for deload week
  volumeMultiplier?: number;
}

export interface TrainingPlan {
  id: string;
  name: string;
  description?: string;
  weeks: TrainingPlanWeek[];
  userId: string;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  goal?: string; // e.g., "Strength", "Hypertrophy", "Cut"
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

// Template stystem
export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  exercises: WorkoutExercise[];
  userId: string;
  isPublic: boolean; // Allow sharing templates
  tags?: string[];
  createdAt: Date;
}

// Progress tracking
export interface ExerciseProgress {
  exerciseId: string;
  date: Date;
  maxWeight: number;
  totalVolume: number; // sets × reps × weight
  estimatedOneRepMax?: number;
  personalRecord?: boolean;
}

export interface WorkoutHistory {
  id: string;
  workoutId: string;
  workout: Workout;
  completedAt: Date;
  actualDuration: number;
  performanceNotes?: string;
}

// User Settings & Preferences
export interface UserSettings {
  userId: string;
  preferredWeightUnit: 'kg' | 'lbs';
  defaultRestTime: number;
  trackRPE: boolean;
  trackTempo: boolean;
  trackRestTime: boolean;
  weekStartsOn: number;
}

// Helper Types
export type PeriodizationPhase =
  | 'hypertrophy'
  | 'strength'
  | 'power'
  | 'deload'
  | 'peaking';

export interface PeriodizationBlock {
  phase: PeriodizationPhase;
  weeks: number;
  description?: string;
}

export interface WorkoutHistoryWithDetails {
  id: string;
  workoutId: string;
  workoutName: string;
  completedAt: string;
  actualDuration: number;
  exerciseCount?: number;
  totalVolume?: number;
}
export interface WorkoutExerciseWithSets {
  exercise: Exercise;
  sets: WorkoutSet[];
  isExpanded?: boolean;
}

export interface WorkoutHistoryDetails {
  id: string;
  workoutId: string;
  workoutName: string;
  completedAt: Date;
  actualDuration: number;
  exercises: WorkoutExerciseWithSets[];
  stats: {
    totalVolume: number;
    completedSets: number;
    totalSets: number;
  };
}

export interface ExerciseProgressWithWorkout {
  id: string;
  exerciseId: string;
  date: Date;
  maxWeight: number;
  totalVolume: number;
  personalRecord: boolean;
  workoutName?: string;
}

// Row Types
export interface ExerciseRow {
  id: string;
  name: string;
  categories: string;
  muscle_groups: string; // JSON string
  instructions: string | null;
  equipment: string | null; // JSON string
  difficulty: string | null;
  measurement_type: string;
  is_custom: number;
  user_id: string | null;
  photo: string | null;
  video: string | null;
  created_at: string;
}

export interface WorkoutSetRow {
  id: string;
  workout_exercise_id: string;
  set_order: number;
  reps: number;
  weight: number | null;
  rpe: number | null;
  tempo: string | null;
  rest_time: number | null;
  completed: number;
  notes: string | null;
  actual_reps: number | null;
  actual_weight: number | null;
  actual_rpe: number | null;
  duration: number | null;
  actual_duration: number | null;
  distance: number | null;
  actual_distance: number | null;
}

export interface WorkoutExerciseRow {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise_order: number;
  superset_group: string | null;
  notes: string | null;
}

export interface WorkoutRow {
  id: string;
  name: string;
  date: string;
  duration: number | null;
  notes: string | null;
  tags: string | null; // JSON string
  completed: number;
  template_id: string | null;
  display_order: number;
  is_active: number;
  created_at: string;
}

export interface WeeklyPlanDayRow {
  id: string;
  weekly_plan_id: string;
  day_of_week: number;
  day_name: string | null;
  workout_id: string | null;
  is_rest_day: number;
}

export interface WeeklyPlanRow {
  id: string;
  name: string;
  week_number: number | null;
  notes: string | null;
  created_at: string;
}

export interface TrainingPlanWeekRow {
  id: string;
  training_plan_id: string;
  week_number: number;
  weekly_plan_id: string;
  notes: string | null;
  intensity_multiplier: number;
  volume_multiplier: number;
}

export interface TrainingPlanRow {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  is_active: number;
  start_date: string | null;
  end_date: string | null;
  goal: string | null;
  tags: string | null; // JSON string
  created_at: string;
  updated_at: string;
}

export interface WorkoutTemplateRow {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  is_public: number;
  tags: string | null; // JSON string
  created_at: string;
}

export interface ExerciseProgressRow {
  id: string;
  exercise_id: string;
  user_id: string;
  date: string;
  max_weight: number;
  total_volume: number;
  estimated_one_rep_max: number | null;
  personal_record: number;
}

export interface WorkoutHistoryRow {
  id: string;
  workout_id: string;
  user_id: string;
  completed_at: string;
  actual_duration: number;
  performance_notes: string | null;
  workout_name?: string;
}

export interface WorkoutHistoryQueryRow {
  id: string;
  workout_id: string;
  workout_name: string;
  completed_at: string;
  actual_duration: number;
}

export interface UserSettingsRow {
  user_id: string;
  preferred_weight_unit: string;
  default_rest_time: number;
  track_rpe: number;
  track_tempo: number;
  track_rest_time: number;
  week_starts_on: number;
}

export interface PeriodizationBlockRow {
  id: string;
  training_plan_id: string;
  phase: string;
  weeks: number;
  description: string | null;
  block_order: number;
}

export interface ExerciseProgressQueryRow {
  id: string;
  exercise_id: string;
  user_id: string;
  date: string;
  max_weight: number;
  total_volume: number;
  estimated_one_rep_max: number | null;
  personal_record: number;
  workout_name: string | null;
}
