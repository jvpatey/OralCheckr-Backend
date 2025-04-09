import { Response } from "supertest";

/* -- Test Interfaces -- */

export interface MockUser {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface MockGuestUser {
  userId: number;
  role: "guest";
}

export interface MockQuestionnaireData extends Record<string, unknown> {
  responses: { [key: number]: number | number[] };
  totalScore: number;
  currentQuestion: number;
}

export interface MockHabit {
  habitId: number;
  userId: number;
  name: string;
  description: string;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockHabitLog {
  logId: number;
  habitId: number;
  date: string;
  count: number;
  createdAt: Date;
  updatedAt: Date;
  habit: {
    name: string;
  };
}

export interface DateParams extends Record<string, unknown> {
  year: string | number;
  month: string;
  day: string | number;
}

export interface TokenPayload {
  userId: number;
  role?: string;
}

export interface TestHeaders {
  [key: string]: string | string[] | undefined;
  "set-cookie"?: string[];
}

// Extend Response type but override headers withcustom type
export type SuperTestResponse = Omit<Response, "headers"> & {
  headers: TestHeaders;
};
