/* -- Habit Interfaces -- */

export interface HabitAttributes {
  habitId: number;
  userId: number;
  name: string;
  count: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HabitCreationAttributes {
  name: string;
  count: number;
  userId: number;
}

export interface HabitResponse extends HabitAttributes {
  message?: string;
}

export interface HabitError extends Error {
  errors?: Array<{
    message: string;
    path: string;
    type: string;
  }>;
}

// Interface for habit update data
export interface HabitUpdateData {
  name: string;
  count: number;
}
