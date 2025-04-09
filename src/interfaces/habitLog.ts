/* -- Habit Log Interfaces -- */

export interface HabitLogResponse {
  id: number;
  date: string;
  count: number;
  habitId: number;
  habitName: string | null;
}

export interface DateParams {
  year: string;
  month: string;
  day: string;
}

export interface LogDeleteResponse {
  log: HabitLogResponse | null;
  deleted: boolean;
}
