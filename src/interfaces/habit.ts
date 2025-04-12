/* -- Habit Interfaces -- */

// Complete habit record structure from the database
export interface HabitAttributes {
  habitId: number;
  userId: number;
  name: string;
  count: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Required fields for creating a new habit
export interface HabitCreationAttributes {
  name: string;
  count: number;
  userId: number;
}

// Response structure for habit operations
export interface HabitResponse extends HabitAttributes {
  message?: string;
}

// Custom error type for habit validation failures
export interface HabitError extends Error {
  errors?: Array<{
    message: string;
    path: string;
    type: string;
  }>;
}

// Structure for updating an existing habit
export interface HabitUpdateData {
  name: string;
  count: number;
}
