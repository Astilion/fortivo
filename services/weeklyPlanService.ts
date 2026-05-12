import * as SQLite from 'expo-sqlite';
import {
  WeeklyPlanRow,
  WeeklyPlanDayRow,
  WeeklyPlan,
  WeeklyPlanWithDays,
  Workout,
} from '@/types/training';
import { generateId } from '@/database/database';
import { logger } from '@/utils/logger';
import { ServiceError } from '@/utils/errors';

interface WeeklyPlanDayQueryRow extends WeeklyPlanDayRow {
  workout_name: string | null;
}

export class WeeklyPlanService {
  private db: SQLite.SQLiteDatabase;

  constructor(database: SQLite.SQLiteDatabase) {
    this.db = database;
  }

  async getWeeklyPlans(): Promise<WeeklyPlanRow[]> {
    const weeklyPlans = await this.db.getAllAsync<WeeklyPlanRow>(
      `SELECT * FROM weekly_plans ORDER BY created_at DESC`,
    );
    return weeklyPlans;
  }

  async getAllPlansWithDetails(): Promise<WeeklyPlanWithDays[]> {
    try {
      type JoinRow = WeeklyPlanRow & {
        day_of_week: number | null;
        is_rest_day: number | null;
        day_name: string | null;
        workout_name: string | null;
      };
      const rows = await this.db.getAllAsync<JoinRow>(
        `SELECT wp.id, wp.name, wp.week_number, wp.notes, wp.created_at, wp.is_active,
                wpd.day_of_week, wpd.is_rest_day, wpd.day_name, w.name as workout_name
         FROM weekly_plans wp
         LEFT JOIN weekly_plan_days wpd ON wpd.weekly_plan_id = wp.id
         LEFT JOIN workouts w ON wpd.workout_id = w.id
         ORDER BY wp.created_at DESC, wpd.day_of_week ASC`,
      );
      const planMap = new Map<string, WeeklyPlanWithDays>();
      for (const row of rows) {
        if (!planMap.has(row.id)) {
          planMap.set(row.id, {
            id: row.id,
            name: row.name,
            week_number: row.week_number,
            notes: row.notes,
            created_at: row.created_at,
            is_active: row.is_active,
            days: [],
          });
        }
        if (row.day_of_week !== null) {
          planMap.get(row.id)!.days.push({
            day_of_week: row.day_of_week,
            is_rest_day: row.is_rest_day ?? 0,
            day_name: row.day_name,
            workout_name: row.workout_name,
          });
        }
      }
      return Array.from(planMap.values());
    } catch (error) {
      logger.error('WeeklyPlanService.getAllPlansWithDetails failed', error);
      throw new ServiceError('Nie udało się pobrać planów tygodniowych', error);
    }
  }

  async getWeeklyPlan(id: string): Promise<WeeklyPlan | null> {
    const planRow = await this.db.getFirstAsync<WeeklyPlanRow>(
      `SELECT * FROM weekly_plans WHERE id = ?`,
      [id],
    );
    if (!planRow) return null;
    return this.buildWeeklyPlan(planRow);
  }

  async createWeeklyPlan(
    name: string,
    weekNumber?: number,
    notes?: string,
  ): Promise<WeeklyPlanRow> {
    const id = generateId('weekly_plan');
    const createdAt = new Date();

    try {
      await this.db.runAsync(
        `INSERT INTO weekly_plans (id, name, week_number, notes, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, name, weekNumber ?? null, notes || null, createdAt.toISOString(), 0],
      );
    } catch (error) {
      logger.error('WeeklyPlanService.createWeeklyPlan failed', error);
      throw new ServiceError('Nie udało się utworzyć planu tygodniowego', error);
    }
    return {
      id,
      name,
      week_number: weekNumber || null,
      notes: notes || null,
      created_at: createdAt.toISOString(),
      is_active: 0,
    } as WeeklyPlanRow;
  }

  async deleteWeeklyPlan(id: string): Promise<void> {
    try {
      await this.db.runAsync(`DELETE FROM weekly_plans WHERE id = ?`, [id]);
    } catch (error) {
      logger.error('WeeklyPlanService.deleteWeeklyPlan failed', error);
      throw new ServiceError('Nie udało się usunąć planu tygodniowego', error);
    }
  }

  async setWeeklyPlanActive(id: string): Promise<void> {
    try {
      await this.db.withTransactionAsync(async () => {
        await this.db.runAsync(`UPDATE weekly_plans SET is_active = 0`);
        await this.db.runAsync(
          `UPDATE weekly_plans SET is_active = 1 WHERE id = ?`,
          [id],
        );
      });
    } catch (error) {
      logger.error('WeeklyPlanService.setWeeklyPlanActive failed', error);
      throw new ServiceError('Nie udało się aktywować planu tygodniowego', error);
    }
  }

  async addWeeklyPlanDay(
    weeklyPlanId: string,
    dayOfWeek: number,
    dayName?: string,
    workoutId?: string,
    isRestDay?: boolean,
  ): Promise<WeeklyPlanDayRow> {
    const id = generateId('weekly_plan_day');
    try {
      await this.db.runAsync(
        `insert into weekly_plan_days (id, weekly_plan_id, day_of_week, day_name, workout_id, is_rest_day) values (?, ?, ?, ?, ?, ?)`,
        [
          id,
          weeklyPlanId,
          dayOfWeek,
          dayName || null,
          workoutId || null,
          isRestDay ? 1 : 0,
        ],
      );
    } catch (error) {
      logger.error('WeeklyPlanService.addWeeklyPlanDay failed', error);
      throw new ServiceError('Nie udało się dodać dnia do planu', error);
    }
    return {
      id,
      weekly_plan_id: weeklyPlanId,
      day_of_week: dayOfWeek,
      day_name: dayName || null,
      workout_id: workoutId || null,
      is_rest_day: isRestDay ? 1 : 0,
    } as WeeklyPlanDayRow;
  }

  async removeWorkoutFromWeeklyPlan(
    weeklyPlanId: string,
    dayOfWeek: number,
  ): Promise<void> {
    await this.db.runAsync(
      `UPDATE weekly_plan_days SET workout_id = NULL, is_rest_day = 1 WHERE weekly_plan_id= ? AND day_of_week = ?`,
      [weeklyPlanId, dayOfWeek],
    );
  }

  async updateWeeklyPlan(
    weeklyPlanId: string,
    name: string,
    weekNumber?: number,
    notes?: string,
  ): Promise<void> {
    try {
      await this.db.runAsync(
        `UPDATE weekly_plans SET name = ?, week_number = ?, notes = ? WHERE id = ?`,
        [name, weekNumber || null, notes || null, weeklyPlanId],
      );
    } catch (error) {
      logger.error('WeeklyPlanService.updateWeeklyPlan failed', error);
      throw new ServiceError('Nie udało się zaktualizować planu tygodniowego', error);
    }
  }

  async getActivePlan(): Promise<WeeklyPlan | null> {
    const planRow = await this.db.getFirstAsync<WeeklyPlanRow>(
      'SELECT * FROM weekly_plans WHERE is_active = 1',
    );

    if (!planRow) return null;
    return this.buildWeeklyPlan(planRow);
  }

  private async buildWeeklyPlan(planRow: WeeklyPlanRow): Promise<WeeklyPlan> {
    const days = await this.db.getAllAsync<WeeklyPlanDayQueryRow>(
      `SELECT 
    wpd.id,
    wpd.weekly_plan_id,
    wpd.day_of_week,
    wpd.day_name,
    wpd.workout_id,
    wpd.is_rest_day,
    w.name as workout_name
    FROM weekly_plan_days wpd
    LEFT JOIN workouts w ON wpd.workout_id = w.id
    WHERE wpd.weekly_plan_id = ?
    ORDER BY wpd.day_of_week ASC`,
      [planRow.id],
    );
    return {
      id: planRow.id,
      name: planRow.name,
      weekNumber: planRow.week_number ?? undefined,
      notes: planRow.notes ?? undefined,
      createdAt: new Date(planRow.created_at),
      isActive: planRow.is_active === 1,
      days: days.map((row) => ({
        id: row.id,
        dayOfWeek: row.day_of_week,
        dayName: row.day_name ?? undefined,
        isRestDay: row.is_rest_day === 1,
        workout: row.workout_id
          ? ({
              id: row.workout_id,
              name: row.workout_name ?? '',
            } as Workout)
          : null,
      })),
    } as WeeklyPlan;
  }

  async deleteAllPlanDays(weeklyPlanId: string): Promise<void> {
    try {
      await this.db.runAsync(
        `DELETE FROM weekly_plan_days WHERE weekly_plan_id = ?`,
        [weeklyPlanId],
      );
    } catch (error) {
      logger.error('WeeklyPlanService.deleteAllPlanDays failed', error);
      throw new ServiceError('Nie udało się usunąć dni planu', error);
    }
  }

  async clearActivePlan(): Promise<void> {
    try {
      await this.db.runAsync(`UPDATE weekly_plans SET is_active = 0`);
    } catch (error) {
      logger.error('WeeklyPlanService.clearActivePlan failed', error);
      throw new ServiceError('Nie udało się wyczyścić aktywnego planu', error);
    }
  }
}
