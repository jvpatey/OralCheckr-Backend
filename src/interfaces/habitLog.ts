import { Model } from "sequelize";

/* -- Habit Log Interfaces -- */

// Basic habit information structure
export interface HabitWithName {
  name: string;
  count: number;
}

// Complete habit log record with associated habit details
export interface HabitLogWithHabit extends Model {
  logId: number;
  habitId: number;
  userId: number;
  date: Date;
  count: number;
  habit?: HabitWithName;
}

// Response structure for habit log operations
export interface HabitLogResponse {
  id: number;
  date: string;
  count: number;
  habitId: number;
  habitName: string | null;
}

// Structure for date-based query parameters
export interface DateParams {
  year: string;
  month: string;
  day: string;
}

// Response structure for habit log deletion
export interface LogDeleteResponse {
  log: HabitLogResponse | null;
  deleted: boolean;
}
