import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../server";
import bcrypt from "bcryptjs";

/* -- Mock Data -- */

// Mock user
export const mockUser = {
  userId: 1,
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
};

// Mock guest user
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

// Mock habits
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

// Mock habit logs
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

// Mock date parameters
export const standardDateParams = {
  year: 2023,
  month: "June",
  day: 15,
};

/* -- Test Utilities -- */

// Generate mock authentication token
export const generateToken = (userId = mockUser.userId, role?: string) => {
  const payload: any = { userId };
  if (role) {
    payload.role = role;
  }
  return jwt.sign(payload, process.env.JWT_SECRET || "test-secret", {
    expiresIn: "1h",
  });
};

// Make mock authenticated request with mock token
export const makeAuthenticatedRequest = (
  method: "get" | "post" | "put" | "delete",
  url: string,
  body?: any,
  userId = mockUser.userId,
  role?: string
) => {
  const token = generateToken(userId, role);

  // Switch case to handle different HTTP methods
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

// Make mock guest request with mock token
export const makeGuestRequest = (
  method: "get" | "post" | "put" | "delete",
  url: string,
  body?: any,
  userId = mockGuestUser.userId
) => {
  return makeAuthenticatedRequest(method, url, body, userId, "guest");
};

// Make mock unauthenticated request (no token)
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

// Check if mock response has a valid auth cookie
export const expectAuthCookie = (res: any) => {
  const cookies = res.headers["set-cookie"];
  expect(Array.isArray(cookies)).toBe(true);
  expect(
    cookies &&
      Array.isArray(cookies) &&
      cookies.some((cookie: string) => cookie.startsWith("accessToken="))
  ).toBe(true);
};

// Check if mock response has a cleared auth cookie on logout
export const expectClearedAuthCookie = (res: any) => {
  const cookies = res.headers["set-cookie"];
  expect(Array.isArray(cookies)).toBe(true);
  expect(
    cookies &&
      Array.isArray(cookies) &&
      cookies.some((cookie: string) => cookie.startsWith("accessToken=;"))
  ).toBe(true);
};

// Check if mock habit log has the correct properties
export const expectLogProperties = (log: any) => {
  // Check if the log has the correct properties
  expect(log).toHaveProperty(log.logId !== undefined ? "logId" : "id");
  expect(log).toHaveProperty("habitId");
  expect(log).toHaveProperty("date");
  expect(log).toHaveProperty("count");
  expect(log).toHaveProperty("habitName");
};

// Generate mock hashed password
export const generateHashedPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

// Check if mock questionnaire response has the correct properties
export const expectQuestionnaireProperties = (response: any) => {
  expect(response).toHaveProperty("responses");
  expect(response).toHaveProperty("totalScore");
  expect(response).toHaveProperty("currentQuestion");
};
