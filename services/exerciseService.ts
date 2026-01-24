import * as SQLite from 'expo-sqlite';
import { generateId } from '../database/database';
import { Exercise, ExerciseRow, FavoriteExerciseRow } from '../types/training';

export class ExerciseService {
  private db: SQLite.SQLiteDatabase;

  constructor(database: SQLite.SQLiteDatabase) {
    this.db = database;
  }

  // Seed initial exercises from JSON
  async seedExercises(exercises: Exercise[]) {
    const existingCount = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM exercises WHERE is_custom = 0',
    );

    // Only skip if we already have exactly this many exercises
    if (existingCount && existingCount.count === exercises.length) {
      console.log(
        `✅ Already seeded ${exercises.length} exercises, skipping...`,
      );
      return;
    }

    // Clear old built-in exercises and reseed
    console.log(
      `🔄 Reseeding exercises (old: ${existingCount?.count || 0}, new: ${exercises.length})...`,
    );
    await this.db.runAsync('DELETE FROM exercises WHERE is_custom = 0');

    const stmt = await this.db.prepareAsync(
      `INSERT INTO exercises (
      id, name, name_en, categories, muscle_groups, instructions, equipment, 
      difficulty, measurement_type, is_custom, user_id, photo, video, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    try {
      for (const exercise of exercises) {
        await stmt.executeAsync([
          exercise.id,
          exercise.name,
          exercise.nameEN || null,
          JSON.stringify(exercise.categories),
          JSON.stringify(exercise.muscleGroups),
          exercise.instructions || null,
          exercise.equipment ? JSON.stringify(exercise.equipment) : null,
          exercise.difficulty || null,
          exercise.measurementType || 'reps',
          0,
          null,
          exercise.photo || null,
          exercise.video || null,
          exercise.createdAt.toISOString(),
        ]);
      }
    } finally {
      await stmt.finalizeAsync();
    }
  }

  // Get all exercises
  async getAllExercises(userId?: string): Promise<Exercise[]> {
    let query = 'SELECT * FROM exercises WHERE is_custom = 0';
    const params: any[] = [];

    if (userId) {
      query += ' OR (is_custom = 1 AND user_id = ?)';
      params.push(userId);
    }

    query += ' ORDER BY is_custom DESC, name ASC';

    const rows = await this.db.getAllAsync<ExerciseRow>(query, params);
    return rows.map(this.mapRowToExercise);
  }

  // Get exercises by category
  async getExercisesByCategory(
    category: string,
    userId?: string,
  ): Promise<Exercise[]> {
    let query =
      'SELECT * FROM exercises WHERE categories LIKE ? AND (is_custom = 0';
    const params: any[] = [`%"${category}"%`];

    if (userId) {
      query += ' OR (is_custom = 1 AND user_id = ?))';
      params.push(userId);
    } else {
      query += ')';
    }

    query += ' ORDER BY name ASC';

    const rows = await this.db.getAllAsync<ExerciseRow>(query, params);
    return rows.map(this.mapRowToExercise);
  }

  // Get exercises by muscle group
  async getExercisesByMuscleGroup(
    muscleGroup: string,
    userId?: string,
  ): Promise<Exercise[]> {
    let query = `SELECT * FROM exercises 
                 WHERE muscle_groups LIKE ? 
                 AND (is_custom = 0`;
    const params: any[] = [`%"${muscleGroup}"%`];

    if (userId) {
      query += ' OR (is_custom = 1 AND user_id = ?))';
      params.push(userId);
    } else {
      query += ')';
    }

    query += ' ORDER BY name ASC';

    const rows = await this.db.getAllAsync<ExerciseRow>(query, params);
    return rows.map(this.mapRowToExercise);
  }

  // Get exercise by ID
  async getExerciseById(id: string): Promise<Exercise | null> {
    const row = await this.db.getFirstAsync<ExerciseRow>(
      'SELECT * FROM exercises WHERE id = ?',
      [id],
    );

    return row ? this.mapRowToExercise(row) : null;
  }

  // Search exercises
  async searchExercises(query: string, userId?: string): Promise<Exercise[]> {
    const searchTerm = `%${query}%`;
    let sql = `SELECT * FROM exercises 
             WHERE (name LIKE ? OR categories LIKE ?) 
             AND (is_custom = 0`;
    const params: any[] = [searchTerm, searchTerm];

    if (userId) {
      sql += ' OR (is_custom = 1 AND user_id = ?))';
      params.push(userId);
    } else {
      sql += ')';
    }

    sql += ' ORDER BY is_custom DESC, name ASC';

    const rows = await this.db.getAllAsync<ExerciseRow>(sql, params);
    return rows.map(this.mapRowToExercise);
  }

  // Create custom exercise
  async createExercise(
    exercise: Omit<Exercise, 'id' | 'isCustom' | 'createdAt'>,
    userId: string,
  ): Promise<Exercise> {
    const id = generateId('ex');
    const createdAt = new Date();

    await this.db.runAsync(
      `INSERT INTO exercises (
        id, name, category, muscle_groups, instructions, equipment, 
        difficulty, is_custom, user_id, photo, video, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        exercise.name,
        JSON.stringify(exercise.categories),
        JSON.stringify(exercise.muscleGroups),
        exercise.instructions || null,
        exercise.equipment ? JSON.stringify(exercise.equipment) : null,
        exercise.difficulty || null,
        exercise.measurementType || 'reps',
        1,
        userId,
        exercise.photo || null,
        exercise.video || null,
        createdAt.toISOString(),
      ],
    );

    return {
      ...exercise,
      id,
      isCustom: true,
      userId,
      createdAt,
    };
  }

  // Update exercise (only custom exercises)
  async updateExercise(
    id: string,
    updates: Partial<
      Omit<Exercise, 'id' | 'isCustom' | 'createdAt' | 'userId'>
    >,
    userId: string,
  ): Promise<void> {
    const exercise = await this.getExerciseById(id);

    if (!exercise || !exercise.isCustom || exercise.userId !== userId) {
      throw new Error('Can only update your own custom exercises');
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.categories !== undefined) {
      fields.push('categories = ?');
      values.push(JSON.stringify(updates.categories));
    }
    if (updates.muscleGroups !== undefined) {
      fields.push('muscle_groups = ?');
      values.push(JSON.stringify(updates.muscleGroups));
    }
    if (updates.instructions !== undefined) {
      fields.push('instructions = ?');
      values.push(updates.instructions);
    }
    if (updates.equipment !== undefined) {
      fields.push('equipment = ?');
      values.push(JSON.stringify(updates.equipment));
    }
    if (updates.difficulty !== undefined) {
      fields.push('difficulty = ?');
      values.push(updates.difficulty);
    }
    if (updates.photo !== undefined) {
      fields.push('photo = ?');
      values.push(updates.photo);
    }
    if (updates.video !== undefined) {
      fields.push('video = ?');
      values.push(updates.video);
    }

    if (fields.length === 0) return;

    values.push(id);

    await this.db.runAsync(
      `UPDATE exercises SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );
  }

  // Delete exercise (only custom exercises)
  async deleteExercise(id: string, userId: string): Promise<void> {
    const exercise = await this.getExerciseById(id);

    if (!exercise || !exercise.isCustom || exercise.userId !== userId) {
      throw new Error('Can only delete your own custom exercises');
    }

    await this.db.runAsync('DELETE FROM exercises WHERE id = ?', [id]);
  }

  // Get all categories
  async getCategories(userId?: string): Promise<string[]> {
    const exercises = await this.getAllExercises(userId);
    const categoriesSet = new Set<string>();

    exercises.forEach((exercise) => {
      exercise.categories.forEach((cat) => categoriesSet.add(cat));
    });

    return Array.from(categoriesSet).sort();
  }

  // Get all muscle groups
  async getMuscleGroups(userId?: string): Promise<string[]> {
    const exercises = await this.getAllExercises(userId);
    const muscleGroupsSet = new Set<string>();

    exercises.forEach((exercise) => {
      exercise.muscleGroups.forEach((muscle) => muscleGroupsSet.add(muscle));
    });

    return Array.from(muscleGroupsSet).sort();
  }

  // Helper to map database row to Exercise object
  private mapRowToExercise(row: ExerciseRow): Exercise {
    return {
      id: row.id,
      name: row.name,
      nameEN: row.name_en || undefined,
      categories: JSON.parse(row.categories),
      muscleGroups: JSON.parse(row.muscle_groups),
      instructions: row.instructions || undefined,
      equipment: row.equipment ? JSON.parse(row.equipment) : undefined,
      difficulty: row.difficulty as
        | 'Początkujący'
        | 'Średniozaawansowany'
        | 'Zaawansowany'
        | undefined,
      measurementType:
        (row.measurement_type as 'reps' | 'time' | 'distance') || 'reps', // <-- NOWE
      isCustom: row.is_custom === 1,
      userId: row.user_id || undefined,
      photo: row.photo || undefined,
      video: row.video || undefined,
      createdAt: new Date(row.created_at),
    };
  }

  // ==================== FAVORITES ====================

  async addFavorite(
    exerciseId: string,
    userId: string = 'user_1',
  ): Promise<void> {
    const createdAt = new Date().toISOString();

    await this.db.runAsync(
      `INSERT OR IGNORE INTO favorite_exercises (user_id, exercise_id, created_at) 
     VALUES (?, ?, ?)`,
      [userId, exerciseId, createdAt],
    );
  }

  async removeFavorite(
    exerciseId: string,
    userId: string = 'user_1',
  ): Promise<void> {
    await this.db.runAsync(
      `DELETE FROM favorite_exercises WHERE user_id = ? AND exercise_id = ?`,
      [userId, exerciseId],
    );
  }

  async getFavorites(userId: string = 'user_1'): Promise<string[]> {
    const rows = await this.db.getAllAsync<FavoriteExerciseRow>(
      'SELECT exercise_id FROM favorite_exercises WHERE user_id = ?',
      [userId],
    );

    return rows.map((row) => row.exercise_id);
  }

  async isFavorite(
    exerciseId: string,
    userId: string = 'user_1',
  ): Promise<boolean> {
    const row = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM favorite_exercises WHERE user_id = ? AND exercise_id = ?',
      [userId, exerciseId],
    );

    return (row?.count || 0) > 0;
  }
}

export { Exercise } from '../types/training';
