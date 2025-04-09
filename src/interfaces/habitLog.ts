import { Model } from "sequelize";

/* -- Habit Log Interfaces -- */

export interface HabitWithName {
  name: string;
  count: number;
}

export interface HabitLogWithHabit extends Model {
  logId: number;
  habitId: number;
  userId: number;
  date: Date;
  count: number;
  habit?: HabitWithName;
}

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
