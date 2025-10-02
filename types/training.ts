// Exercise Database
export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  instructions?: string;
  equipment?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  isCustom: boolean;
  userId?: string; // Only for custom exercises
  createdAt: Date;
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

export type Difficulty =
  | 'początkujący'
  | 'średniozaawansowany'
  | 'zaawansowany';
