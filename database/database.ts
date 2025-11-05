import * as SQLite from 'expo-sqlite';

const DB_NAME = 'fortivo_v3.db';

export const initDatabase = async () => {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- ==================== EXERCISES ====================
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      muscle_groups TEXT NOT NULL, -- JSON array
      instructions TEXT,
      equipment TEXT, -- JSON array
      difficulty TEXT CHECK(difficulty IN ('Początkujący', 'Średniozaawansowany', 'Zaawansowany')),
      is_custom INTEGER DEFAULT 0,
      user_id TEXT,
      photo TEXT,
      video TEXT,
      created_at TEXT NOT NULL
    );

    -- ==================== WORKOUT SETS ====================
    CREATE TABLE IF NOT EXISTS workout_sets (
      id TEXT PRIMARY KEY,
      workout_exercise_id TEXT NOT NULL,
      set_order INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      weight REAL,
      rpe REAL,
      tempo TEXT,
      rest_time INTEGER,
      completed INTEGER DEFAULT 0,
      notes TEXT,
      actual_reps INTEGER,
      actual_weight REAL,
      actual_rpe REAL,
      FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE
    );

    -- ==================== WORKOUT EXERCISES ====================
    CREATE TABLE IF NOT EXISTS workout_exercises (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      exercise_order INTEGER NOT NULL,
      superset_group TEXT,
      notes TEXT,
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );

    -- ==================== WORKOUTS ====================
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      duration INTEGER,
      notes TEXT,
      tags TEXT, -- JSON array
      completed INTEGER DEFAULT 0,
      template_id TEXT,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 0, 
      created_at TEXT NOT NULL,
      FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE SET NULL
    );

    -- ==================== WEEKLY PLAN DAYS ====================
    CREATE TABLE IF NOT EXISTS weekly_plan_days (
      id TEXT PRIMARY KEY,
      weekly_plan_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
      day_name TEXT,
      workout_id TEXT,
      is_rest_day INTEGER DEFAULT 0,
      FOREIGN KEY (weekly_plan_id) REFERENCES weekly_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE SET NULL
    );

    -- ==================== WEEKLY PLANS ====================
    CREATE TABLE IF NOT EXISTS weekly_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      week_number INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    -- ==================== TRAINING PLAN WEEKS ====================
    CREATE TABLE IF NOT EXISTS training_plan_weeks (
      id TEXT PRIMARY KEY,
      training_plan_id TEXT NOT NULL,
      week_number INTEGER NOT NULL,
      weekly_plan_id TEXT NOT NULL,
      notes TEXT,
      intensity_multiplier REAL DEFAULT 1.0,
      volume_multiplier REAL DEFAULT 1.0,
      FOREIGN KEY (training_plan_id) REFERENCES training_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (weekly_plan_id) REFERENCES weekly_plans(id) ON DELETE CASCADE
    );

    -- ==================== TRAINING PLANS ====================
    CREATE TABLE IF NOT EXISTS training_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      user_id TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      goal TEXT,
      tags TEXT, -- JSON array
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- ==================== WORKOUT TEMPLATES ====================
    CREATE TABLE IF NOT EXISTS workout_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      user_id TEXT NOT NULL,
      is_public INTEGER DEFAULT 0,
      tags TEXT, -- JSON array
      created_at TEXT NOT NULL
    );

    -- ==================== TEMPLATE EXERCISES ====================
    -- Template exercises are separate from workout exercises
    CREATE TABLE IF NOT EXISTS template_exercises (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      exercise_order INTEGER NOT NULL,
      superset_group TEXT,
      notes TEXT,
      FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );

    -- ==================== TEMPLATE SETS ====================
    CREATE TABLE IF NOT EXISTS template_sets (
      id TEXT PRIMARY KEY,
      template_exercise_id TEXT NOT NULL,
      set_order INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      weight REAL,
      rpe REAL,
      tempo TEXT,
      rest_time INTEGER,
      notes TEXT,
      FOREIGN KEY (template_exercise_id) REFERENCES template_exercises(id) ON DELETE CASCADE
    );

    -- ==================== EXERCISE PROGRESS ====================
    CREATE TABLE IF NOT EXISTS exercise_progress (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      max_weight REAL NOT NULL,
      total_volume REAL NOT NULL,
      estimated_one_rep_max REAL,
      personal_record INTEGER DEFAULT 0,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );

    -- ==================== WORKOUT HISTORY ====================
    CREATE TABLE IF NOT EXISTS workout_history (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      actual_duration INTEGER NOT NULL,
      performance_notes TEXT,
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
    );

    -- ==================== USER SETTINGS ====================
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      preferred_weight_unit TEXT CHECK(preferred_weight_unit IN ('kg', 'lbs')) DEFAULT 'kg',
      default_rest_time INTEGER DEFAULT 90,
      track_rpe INTEGER DEFAULT 1,
      track_tempo INTEGER DEFAULT 0,
      track_rest_time INTEGER DEFAULT 1,
      week_starts_on INTEGER DEFAULT 1 CHECK(week_starts_on BETWEEN 0 AND 6)
    );

    -- ==================== PERIODIZATION BLOCKS ====================
    CREATE TABLE IF NOT EXISTS periodization_blocks (
      id TEXT PRIMARY KEY,
      training_plan_id TEXT NOT NULL,
      phase TEXT CHECK(phase IN ('hypertrophy', 'strength', 'power', 'deload', 'peaking')),
      weeks INTEGER NOT NULL,
      description TEXT,
      block_order INTEGER NOT NULL,
      FOREIGN KEY (training_plan_id) REFERENCES training_plans(id) ON DELETE CASCADE
    );

    -- ==================== INDEXES ====================
    CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
    CREATE INDEX IF NOT EXISTS idx_exercises_custom ON exercises(is_custom);
    CREATE INDEX IF NOT EXISTS idx_exercises_user ON exercises(user_id);
    
    CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON workout_exercises(workout_id);
    CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise ON workout_exercises(exercise_id);
    
    CREATE INDEX IF NOT EXISTS idx_workout_sets_workout_exercise ON workout_sets(workout_exercise_id);
    
    CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);
    CREATE INDEX IF NOT EXISTS idx_workouts_display_order ON workouts(display_order);
    CREATE INDEX IF NOT EXISTS idx_workouts_active ON workouts(is_active);
    CREATE INDEX IF NOT EXISTS idx_workouts_template ON workouts(template_id);
    
    CREATE INDEX IF NOT EXISTS idx_weekly_plan_days_plan ON weekly_plan_days(weekly_plan_id);
    CREATE INDEX IF NOT EXISTS idx_weekly_plan_days_workout ON weekly_plan_days(workout_id);
    
    CREATE INDEX IF NOT EXISTS idx_training_plan_weeks_plan ON training_plan_weeks(training_plan_id);
    CREATE INDEX IF NOT EXISTS idx_training_plan_weeks_weekly_plan ON training_plan_weeks(weekly_plan_id);
    
    CREATE INDEX IF NOT EXISTS idx_training_plans_user ON training_plans(user_id);
    CREATE INDEX IF NOT EXISTS idx_training_plans_active ON training_plans(is_active);
    
    CREATE INDEX IF NOT EXISTS idx_workout_templates_user ON workout_templates(user_id);
    CREATE INDEX IF NOT EXISTS idx_workout_templates_public ON workout_templates(is_public);
    
    CREATE INDEX IF NOT EXISTS idx_template_exercises_template ON template_exercises(template_id);
    CREATE INDEX IF NOT EXISTS idx_template_sets_template_exercise ON template_sets(template_exercise_id);
    
    CREATE INDEX IF NOT EXISTS idx_exercise_progress_exercise ON exercise_progress(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_exercise_progress_user_date ON exercise_progress(user_id, date);
    
    CREATE INDEX IF NOT EXISTS idx_workout_history_workout ON workout_history(workout_id);
    CREATE INDEX IF NOT EXISTS idx_workout_history_user_date ON workout_history(user_id, completed_at);
  `);

  return db;
};

// Helper function to generate UUID
export const generateId = (prefix: string) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export default initDatabase;
