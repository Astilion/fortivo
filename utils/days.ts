export const DAYS_OF_WEEK = [
  { dayOfWeek: 1, dayName: 'Poniedziałek' },
  { dayOfWeek: 2, dayName: 'Wtorek' },
  { dayOfWeek: 3, dayName: 'Środa' },
  { dayOfWeek: 4, dayName: 'Czwartek' },
  { dayOfWeek: 5, dayName: 'Piątek' },
  { dayOfWeek: 6, dayName: 'Sobota' },
  { dayOfWeek: 0, dayName: 'Niedziela' },
] as const;

export type DayConfig = {
  dayOfWeek: number;
  dayName: string;
  workoutId: string | null;
  workoutName: string | null;
  isRestDay: boolean;
};

/**
 * Returns the local-midnight start of the week containing `date`, where the
 * week begins on `weekStartsOn` (0 = Sunday … 6 = Saturday, matching
 * `Date.getDay()` and `user_settings.week_starts_on`).
 *
 * If `date`'s weekday already equals `weekStartsOn`, the week starts that day;
 * otherwise it walks back to the most recent occurrence of that weekday.
 * Uses local time so the boundary is local midnight, not UTC.
 */
export const getWeekStart = (date: Date, weekStartsOn: number): Date => {
  const start = new Date(date);
  const diff = (start.getDay() - weekStartsOn + 7) % 7;
  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

export const createEmptyWeekDays = (): DayConfig[] =>
  DAYS_OF_WEEK.map((day) => ({
    dayOfWeek: day.dayOfWeek,
    dayName: day.dayName,
    workoutId: null,
    workoutName: null,
    isRestDay: false,
  }));
