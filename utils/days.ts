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

export const createEmptyWeekDays = (): DayConfig[] =>
  DAYS_OF_WEEK.map((day) => ({
    dayOfWeek: day.dayOfWeek,
    dayName: day.dayName,
    workoutId: null,
    workoutName: null,
    isRestDay: false,
  }));
