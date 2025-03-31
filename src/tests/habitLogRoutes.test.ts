import sequelize from "../db/db";
import Habit from "../models/habitModel";
import HabitLog from "../models/habitLogModel";
import { Op } from "sequelize";
import {
  mockUser,
  mockHabits,
  mockLogs,
  makeAuthenticatedRequest,
  makeUnauthenticatedRequest,
  expectLogProperties,
  standardDateParams,
} from "./utils/testUtils";

/* -- Habit Log Routes Tests -- */

// JWT secret for tests
process.env.JWT_SECRET = "testsecret";

/* -- Initialize test suite for habit log routes -- */
describe("Habit Log Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // Test the habit log GET endpoint
  describe("GET /habit-logs/:habitId", () => {
    it("should return all logs for a specific habit", async () => {
      jest.spyOn(HabitLog, "findAll").mockResolvedValue(mockLogs as any);

      const res = await makeAuthenticatedRequest("get", "/habit-logs/1");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("logs");
      expect(Array.isArray(res.body.logs)).toBe(true);
      expect(res.body.logs.length).toBe(2);
      expectLogProperties(res.body.logs[0]);
    });

    it("should return 401 if not authenticated", async () => {
      const res = await makeUnauthenticatedRequest("get", "/habit-logs/1");
      expect(res.status).toBe(401);
    });

    it("should return empty object if no logs exist", async () => {
      jest.spyOn(HabitLog, "findAll").mockResolvedValue([]);

      const res = await makeAuthenticatedRequest("get", "/habit-logs/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ logs: [] });
    });

    it("should filter logs by year and month if provided", async () => {
      jest.spyOn(HabitLog, "findAll").mockImplementation((options: any) => {
        if (options?.where?.date?.[Op.between]) {
          return Promise.resolve([mockLogs[0]] as any);
        }
        return Promise.resolve(mockLogs as any);
      });

      const res = await makeAuthenticatedRequest(
        "get",
        "/habit-logs/1?year=2023&month=June"
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("logs");
      expect(res.body.logs.length).toBe(1);
    });
  });

  // Tests the habit log increment endpoint
  describe("POST /habit-logs/:habitId/increment", () => {
    it("should increment habit count for a specific date", async () => {
      jest.spyOn(Habit, "findOne").mockResolvedValue(mockHabits[0] as any);
      jest.spyOn(HabitLog, "findOne").mockResolvedValue(null);
      jest.spyOn(HabitLog, "upsert").mockResolvedValue([
        {
          logId: 1,
          habitId: 1,
          userId: mockUser.userId,
          date: new Date(2023, 5, 15),
          count: 1,
        } as any,
        true,
      ] as any);

      const res = await makeAuthenticatedRequest(
        "post",
        "/habit-logs/1/increment",
        standardDateParams
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("log");
      expectLogProperties(res.body.log);
      expect(res.body.log.count).toBe(1);
    });

    it("should increment existing log count", async () => {
      jest.spyOn(Habit, "findOne").mockResolvedValue(mockHabits[0] as any);
      jest.spyOn(HabitLog, "findOne").mockResolvedValue({
        habitId: 1,
        userId: mockUser.userId,
        date: new Date(2023, 5, 15),
        count: 1,
      } as any);

      jest.spyOn(HabitLog, "upsert").mockResolvedValue([
        {
          logId: 1,
          habitId: 1,
          userId: mockUser.userId,
          date: new Date(2023, 5, 15),
          count: 2,
        } as any,
        true,
      ] as any);

      const res = await makeAuthenticatedRequest(
        "post",
        "/habit-logs/1/increment",
        standardDateParams
      );

      expect(res.status).toBe(200);
      expect(res.body.log).toHaveProperty("count", 2);
    });

    it("should validate input parameters and handle errors", async () => {
      // Test missing date parameters
      const resMissingParams = await makeAuthenticatedRequest(
        "post",
        "/habit-logs/1/increment",
        { year: 2023, month: "June" }
      );
      expect(resMissingParams.status).toBe(400);
      expect(resMissingParams.body).toHaveProperty("error");

      // Test invalid month format
      const resInvalidMonth = await makeAuthenticatedRequest(
        "post",
        "/habit-logs/1/increment",
        { year: 2023, month: "InvalidMonth", day: 15 }
      );
      expect(resInvalidMonth.status).toBe(400);
      expect(resInvalidMonth.body).toHaveProperty("error");

      // Test future date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const resFutureDate = await makeAuthenticatedRequest(
        "post",
        "/habit-logs/1/increment",
        {
          year: tomorrow.getFullYear(),
          month: tomorrow.toLocaleString("default", { month: "long" }),
          day: tomorrow.getDate(),
        }
      );
      expect(resFutureDate.status).toBe(400);
      expect(resFutureDate.body).toHaveProperty("error");
      expect(resFutureDate.body.error).toContain("future date");
    });

    it("should handle non-existent habit and max count limit", async () => {
      // Test non-existent habit
      jest.spyOn(Habit, "findOne").mockResolvedValue(null);
      const resNotFound = await makeAuthenticatedRequest(
        "post",
        "/habit-logs/999/increment",
        standardDateParams
      );
      expect(resNotFound.status).toBe(404);
      expect(resNotFound.body).toHaveProperty("error");

      // Test max count limit
      jest.spyOn(Habit, "findOne").mockResolvedValue(mockHabits[0] as any);
      jest.spyOn(HabitLog, "findOne").mockResolvedValue({
        habitId: 1,
        userId: mockUser.userId,
        date: new Date(2023, 5, 15),
        count: 3,
      } as any);

      const resMaxCount = await makeAuthenticatedRequest(
        "post",
        "/habit-logs/1/increment",
        standardDateParams
      );
      expect(resMaxCount.status).toBe(400);
      expect(resMaxCount.body).toHaveProperty("error");
      expect(resMaxCount.body.error).toContain("exceed habit's maximum count");
    });
  });

  // Test the habit log decrement endpoint
  describe("POST /habit-logs/:habitId/decrement", () => {
    it("should delete log if count becomes 0", async () => {
      jest.spyOn(HabitLog, "findOne").mockResolvedValue({
        logId: 1,
        habitId: 1,
        userId: mockUser.userId,
        date: new Date(2023, 5, 15),
        count: 1,
        destroy: jest.fn().mockResolvedValue(true),
      } as any);

      // Make request
      const res = await makeAuthenticatedRequest(
        "post",
        "/habit-logs/1/decrement",
        standardDateParams
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("log", null);
      expect(res.body).toHaveProperty("deleted", true);
    });

    it("should decrement habit count for a specific date", async () => {
      jest.spyOn(HabitLog, "findOne").mockResolvedValue({
        logId: 1,
        habitId: 1,
        userId: mockUser.userId,
        date: new Date(2023, 5, 15),
        count: 2,
        save: jest.fn().mockImplementation(function (this: any) {
          this.count = 1;
          return Promise.resolve(this);
        }),
      } as any);

      const res = await makeAuthenticatedRequest(
        "post",
        "/habit-logs/1/decrement",
        standardDateParams
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("log");
      expect(res.body.log).toHaveProperty("count", 1);
    });

    it("should return 404 if log not found", async () => {
      jest.spyOn(HabitLog, "findOne").mockResolvedValue(null);

      const res = await makeAuthenticatedRequest(
        "post",
        "/habit-logs/1/decrement",
        standardDateParams
      );

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("Error Handling", () => {
    it("should require authentication for all endpoints", async () => {
      // GET /habits
      const getRes = await makeUnauthenticatedRequest("get", "/habit-logs/1");
      expect(getRes.status).toBe(401);

      // POST /habits
      const incrementRes = await makeUnauthenticatedRequest(
        "post",
        "/habit-logs/1/increment",
        standardDateParams
      );
      expect(incrementRes.status).toBe(401);

      // DELETE /habits
      const decrementRes = await makeUnauthenticatedRequest(
        "post",
        "/habit-logs/1/decrement",
        standardDateParams
      );
      expect(decrementRes.status).toBe(401);
    });

    it("should handle database errors gracefully", async () => {
      // Test GET endpoint
      jest
        .spyOn(HabitLog, "findAll")
        .mockRejectedValue(new Error("Database error"));
      const getRes = await makeAuthenticatedRequest("get", "/habit-logs/1");
      expect(getRes.status).toBe(500);
      expect(getRes.body).toHaveProperty("error");

      // Test increment endpoint
      jest
        .spyOn(Habit, "findOne")
        .mockRejectedValue(new Error("Database error"));
      const incrementRes = await makeAuthenticatedRequest(
        "post",
        "/habit-logs/1/increment",
        standardDateParams
      );
      expect(incrementRes.status).toBe(500);
      expect(incrementRes.body).toHaveProperty("error");

      // Test decrement endpoint
      jest
        .spyOn(HabitLog, "findOne")
        .mockRejectedValue(new Error("Database error"));
      const decrementRes = await makeAuthenticatedRequest(
        "post",
        "/habit-logs/1/decrement",
        standardDateParams
      );
      expect(decrementRes.status).toBe(500);
      expect(decrementRes.body).toHaveProperty("error");
    });

    it("should enforce proper authorization and access control", async () => {
      // Test accessing another user's habit logs
      jest.spyOn(HabitLog, "findAll").mockImplementation((options: any) => {
        if (options?.where?.userId === mockUser.userId) {
          return Promise.resolve([]);
        }
        return Promise.resolve(mockLogs as any);
      });
      const getRes = await makeAuthenticatedRequest("get", "/habit-logs/999");
      expect(getRes.status).toBe(200);
      expect(getRes.body).toEqual({ logs: [] });

      // Test incrementing another user's habit
      jest.spyOn(Habit, "findOne").mockImplementation((options: any) => {
        if (options?.where?.userId === mockUser.userId) {
          return Promise.resolve(null);
        }
        return Promise.resolve(mockHabits[0] as any);
      });
      const incrementRes = await makeAuthenticatedRequest(
        "post",
        "/habit-logs/999/increment",
        standardDateParams
      );
      expect(incrementRes.status).toBe(404);
      expect(incrementRes.body).toHaveProperty("error");

      // Test decrementing another user's habit log
      jest.spyOn(HabitLog, "findOne").mockImplementation((options: any) => {
        if (options?.where?.userId === mockUser.userId) {
          return Promise.resolve(null);
        }
        return Promise.resolve(mockLogs[0] as any);
      });
      const decrementRes = await makeAuthenticatedRequest(
        "post",
        "/habit-logs/999/decrement",
        standardDateParams
      );
      expect(decrementRes.status).toBe(404);
      expect(decrementRes.body).toHaveProperty("error");
    });
  });
});
