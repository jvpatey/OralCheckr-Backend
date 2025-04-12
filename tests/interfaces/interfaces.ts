import { Response } from "supertest";

/* -- Test Interfaces -- */

// Mock user interface
export interface MockUser {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
}

// Mock guest user interface
export interface MockGuestUser {
  userId: number;
  role: "guest";
}

// Mock questionnaire data interface
export interface MockQuestionnaireData extends Record<string, unknown> {
  responses: { [key: number]: number | number[] };
  totalScore: number;
  currentQuestion: number;
}

// Mock habit interface
export interface MockHabit {
  habitId: number;
  userId: number;
  name: string;
  description: string;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mock habit log interface
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

// Date parameters interface
export interface DateParams extends Record<string, unknown> {
  year: string | number;
  month: string;
  day: string | number;
}

// Token payload interface
export interface TokenPayload {
  userId: number;
  role?: string;
}

// Test headers interface
export interface TestHeaders {
  [key: string]: string | string[] | undefined;
  "set-cookie"?: string[];
}

// SuperTest response interface
export type SuperTestResponse = Omit<Response, "headers"> & {
  headers: TestHeaders;
};
