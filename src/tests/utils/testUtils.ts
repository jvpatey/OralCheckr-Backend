import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../server";
import bcrypt from "bcryptjs";
import { Response } from "supertest";

// Mock user for testing
export const mockUser = {
  userId: 1,
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
};

// Mock guest user for testing
export const mockGuestUser = {
  userId: 5555,
  role: "guest",
};

// Mock questionnaire data
export const mockQuestionnaireData = {
  responses: { 1: 2, 2: [1, 3] },
  totalScore: 85,
  currentQuestion: 1,
};

// Mock habits for testing
export const mockHabits = [
  {
    habitId: 1,
    userId: 1,
    name: "Brush teeth",
    description: "Brush teeth twice a day",
    count: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    habitId: 2,
    userId: 1,
    name: "Floss",
    description: "Floss once a day",
    count: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock logs for testing
export const mockLogs = [
  {
    logId: 1,
    habitId: 1,
    date: "2023-05-01",
    count: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    habit: {
      name: "Brush teeth",
    },
  },
  {
    logId: 2,
    habitId: 1,
    date: "2023-05-02",
    count: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    habit: {
      name: "Brush teeth",
    },
  },
];

// Standard date parameters for testing
export const standardDateParams = {
  year: 2023,
  month: "June",
  day: 15,
};

// Generate authentication token for tests
export const generateToken = (userId = mockUser.userId, role?: string) => {
  const payload: any = { userId };
  if (role) {
    payload.role = role;
  }
  return jwt.sign(payload, process.env.JWT_SECRET || "test-secret", {
    expiresIn: "1h",
  });
};

// Make authenticated request with token
export const makeAuthenticatedRequest = (
  method: "get" | "post" | "put" | "delete",
  url: string,
  body?: any,
  userId = mockUser.userId,
  role?: string
) => {
  const token = generateToken(userId, role);

  switch (method.toLowerCase()) {
    case "get":
      return request(app)
        .get(url)
        .set("Cookie", [`accessToken=${token}`]);
    case "post":
      return request(app)
        .post(url)
        .set("Cookie", [`accessToken=${token}`])
        .send(body);
    case "put":
      return request(app)
        .put(url)
        .set("Cookie", [`accessToken=${token}`])
        .send(body);
    case "delete":
      return request(app)
        .delete(url)
        .set("Cookie", [`accessToken=${token}`]);
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
};

// Make guest request with token
export const makeGuestRequest = (
  method: "get" | "post" | "put" | "delete",
  url: string,
  body?: any,
  userId = mockGuestUser.userId
) => {
  return makeAuthenticatedRequest(method, url, body, userId, "guest");
};

// Make unauthenticated request (no token)
export const makeUnauthenticatedRequest = (
  method: "get" | "post" | "put" | "delete",
  url: string,
  body?: any
) => {
  switch (method.toLowerCase()) {
    case "get":
      return request(app).get(url);
    case "post":
      return request(app).post(url).send(body);
    case "put":
      return request(app).put(url).send(body);
    case "delete":
      return request(app).delete(url);
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
};

// Utility to check if response has a valid auth cookie
export const expectAuthCookie = (res: any) => {
  const cookies = res.headers["set-cookie"];
  expect(Array.isArray(cookies)).toBe(true);
  expect(
    cookies &&
      Array.isArray(cookies) &&
      cookies.some((cookie: string) => cookie.startsWith("accessToken="))
  ).toBe(true);
};

// Utility to check if response has a cleared auth cookie (logout)
export const expectClearedAuthCookie = (res: any) => {
  const cookies = res.headers["set-cookie"];
  expect(Array.isArray(cookies)).toBe(true);
  expect(
    cookies &&
      Array.isArray(cookies) &&
      cookies.some((cookie: string) => cookie.startsWith("accessToken=;"))
  ).toBe(true);
};

// Utility to check log properties
export const expectLogProperties = (log: any) => {
  // Check for either logId or id (depending on the response format)
  expect(log).toHaveProperty(log.logId !== undefined ? "logId" : "id");
  expect(log).toHaveProperty("habitId");
  expect(log).toHaveProperty("date");
  expect(log).toHaveProperty("count");
  expect(log).toHaveProperty("habitName");
};

// Utility to generate hashed password for tests
export const generateHashedPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

// Utility to check questionnaire response properties
export const expectQuestionnaireProperties = (response: any) => {
  expect(response).toHaveProperty("responses");
  expect(response).toHaveProperty("totalScore");
  expect(response).toHaveProperty("currentQuestion");
};
