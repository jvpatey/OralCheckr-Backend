import request from "supertest";
import app from "../server";
import sequelize from "../db/db";
import jwt from "jsonwebtoken";
import Habit from "../models/habitModel";
import HabitLog from "../models/habitLogModel";
import { Op } from "sequelize";

process.env.JWT_SECRET = "testsecret";

describe("Habit Log Routes", () => {
  // Setup: Mock user and habit data for testing
  const mockUser = { userId: 1 };
  const mockHabit = {
    habitId: 1,
    userId: 1,
    name: "Test Habit",
    description: "Test Description",
    count: 3,
  };

  // Generate authentication token
  const generateToken = () => {
    return jwt.sign(
      { userId: mockUser.userId },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1h" }
    );
  };

  // Sample habit logs
  const mockLogs = [
    {
      logId: 1,
      habitId: 1,
      userId: mockUser.userId,
      date: new Date(2023, 5, 15), // June 15, 2023
      count: 2,
      habit: mockHabit,
    },
    {
      logId: 2,
      habitId: 1,
      userId: mockUser.userId,
      date: new Date(2023, 5, 16), // June 16, 2023
      count: 1,
      habit: mockHabit,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Tests for GET /habit-logs/:habitId endpoint
  describe("GET /habit-logs/:habitId", () => {
    // Test: Successfully retrieve all logs for a specific habit
    it("should return all logs for a specific habit", async () => {
      jest.spyOn(HabitLog, "findAll").mockResolvedValue(mockLogs as any);

      const token = generateToken();
      const res = await request(app)
        .get("/habit-logs/1")
        .set("Cookie", [`accessToken=${token}`]);

      expect(res.status).toBe(200);
      // Check for transformed logs format (year -> month -> day -> count)
      expect(res.body).toHaveProperty("2023");
      expect(res.body["2023"]).toHaveProperty("June");
      expect(res.body["2023"]["June"]).toHaveProperty("15", 2);
      expect(res.body["2023"]["June"]).toHaveProperty("16", 1);
    });

    // Test: Ensure authentication is required
    it("should return 401 if not authenticated", async () => {
      const res = await request(app).get("/habit-logs/1");
      expect(res.status).toBe(401);
    });

    // Test: Handle case when no logs exist
    it("should return empty object if no logs exist", async () => {
      jest.spyOn(HabitLog, "findAll").mockResolvedValue([]);

      const token = generateToken();
      const res = await request(app)
        .get("/habit-logs/1")
        .set("Cookie", [`accessToken=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({});
    });

    // Test: Filter logs by year and month
    it("should filter logs by year and month if provided", async () => {
      jest.spyOn(HabitLog, "findAll").mockImplementation((options: any) => {
        if (options?.where?.date?.[Op.between]) {
          return Promise.resolve([mockLogs[0]] as any);
        }
        return Promise.resolve(mockLogs as any);
      });

      const token = generateToken();
      const res = await request(app)
        .get("/habit-logs/1?year=2023&month=June")
        .set("Cookie", [`accessToken=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("2023");
      expect(res.body["2023"]).toHaveProperty("June");
    });

    // Test: Gracefully handle database errors
    it("should handle database errors gracefully", async () => {
      jest
        .spyOn(HabitLog, "findAll")
        .mockRejectedValue(new Error("Database error"));

      const token = generateToken();
      const res = await request(app)
        .get("/habit-logs/1")
        .set("Cookie", [`accessToken=${token}`]);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error");
    });
  });

  // Tests for POST /habit-logs/:habitId/increment endpoint
  describe("POST /habit-logs/:habitId/increment", () => {
    // Test: Successfully increment habit count for a specific date
    it("should increment habit count for a specific date", async () => {
      jest.spyOn(Habit, "findOne").mockResolvedValue(mockHabit as any);
      jest.spyOn(HabitLog, "findOne").mockResolvedValue(null);
      jest.spyOn(HabitLog, "upsert").mockResolvedValue([
        {
          habitId: 1,
          userId: mockUser.userId,
          date: new Date(2023, 5, 15),
          count: 1,
        } as any,
        true,
      ] as any);

      const token = generateToken();
      const res = await request(app)
        .post("/habit-logs/1/increment")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          year: 2023,
          month: "June",
          day: 15,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("2023");
      expect(res.body["2023"]).toHaveProperty("June");
      expect(res.body["2023"]["June"]).toHaveProperty("15", 1);
    });

    // Test: Increment existing log count
    it("should increment existing log count", async () => {
      jest.spyOn(Habit, "findOne").mockResolvedValue(mockHabit as any);
      jest.spyOn(HabitLog, "findOne").mockResolvedValue({
        habitId: 1,
        userId: mockUser.userId,
        date: new Date(2023, 5, 15),
        count: 1,
      } as any);

      jest.spyOn(HabitLog, "upsert").mockResolvedValue([
        {
          habitId: 1,
          userId: mockUser.userId,
          date: new Date(2023, 5, 15),
          count: 2,
        } as any,
        true,
      ] as any);

      const token = generateToken();
      const res = await request(app)
        .post("/habit-logs/1/increment")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          year: 2023,
          month: "June",
          day: 15,
        });

      expect(res.status).toBe(200);
      expect(res.body["2023"]["June"]["15"]).toBe(2);
    });

    // Test: Ensure authentication is required
    it("should return 401 if not authenticated", async () => {
      const res = await request(app).post("/habit-logs/1/increment").send({
        year: 2023,
        month: "June",
        day: 15,
      });

      expect(res.status).toBe(401);
    });

    // Test: Validate required date parameters
    it("should return 400 if date parameters are missing", async () => {
      const token = generateToken();
      const res = await request(app)
        .post("/habit-logs/1/increment")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          year: 2023,
          month: "June",
          // day is missing
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    // Test: Validate month name format
    it("should return 400 if month name is invalid", async () => {
      const token = generateToken();
      const res = await request(app)
        .post("/habit-logs/1/increment")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          year: 2023,
          month: "InvalidMonth",
          day: 15,
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body).toHaveProperty("validMonths");
    });

    // Test: Handle non-existent habit
    it("should return 404 if habit not found", async () => {
      // Reset any previous mocks
      jest.restoreAllMocks();

      jest.spyOn(Habit, "findOne").mockResolvedValue(null);

      const token = generateToken();
      const res = await request(app)
        .post("/habit-logs/999/increment")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          year: 2023,
          month: "June",
          day: 15,
        });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error");
    });

    // Test: Enforce maximum count limit
    it("should return 400 if incrementing would exceed max count", async () => {
      jest.spyOn(Habit, "findOne").mockResolvedValue(mockHabit as any);
      jest.spyOn(HabitLog, "findOne").mockResolvedValue({
        habitId: 1,
        userId: mockUser.userId,
        date: new Date(2023, 5, 15),
        count: 3, // Already at max (mockHabit.maxCount is 3)
      } as any);

      const token = generateToken();
      const res = await request(app)
        .post("/habit-logs/1/increment")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          year: 2023,
          month: "June",
          day: 15,
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toContain("exceed habit's maximum count");
    });

    // Test: Gracefully handle database errors
    it("should handle database errors gracefully", async () => {
      jest
        .spyOn(Habit, "findOne")
        .mockRejectedValue(new Error("Database error"));

      const token = generateToken();
      const res = await request(app)
        .post("/habit-logs/1/increment")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          year: 2023,
          month: "June",
          day: 15,
        });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error");
    });

    // Test: Validate future date (skipped for now)
    it.skip("should return 400 if date is in the future", async () => {
      jest.spyOn(Habit, "findOne").mockResolvedValue(mockHabit as any);

      const token = generateToken();
      const res = await request(app)
        .post("/habit-logs/1/increment")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          year: 2023,
          month: "June",
          day: 16, // Future date
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  // Tests for POST /habit-logs/:habitId/decrement endpoint
  describe("POST /habit-logs/:habitId/decrement", () => {
    // Test: Delete log if count becomes 0
    it("should delete log if count becomes 0", async () => {
      jest.spyOn(HabitLog, "findOne").mockResolvedValue({
        habitId: 1,
        userId: mockUser.userId,
        date: new Date(2023, 5, 15),
        count: 1,
        destroy: jest.fn().mockResolvedValue(true),
      } as any);

      const token = generateToken();
      const res = await request(app)
        .post("/habit-logs/1/decrement")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          year: 2023,
          month: "June",
          day: 15,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("2023");
      expect(res.body["2023"]).toHaveProperty("June");
      expect(res.body["2023"]["June"]).toHaveProperty("15", 0);
    });

    // Test: Ensure authentication is required
    it("should return 401 if not authenticated", async () => {
      const res = await request(app).post("/habit-logs/1/decrement").send({
        year: 2023,
        month: "June",
        day: 15,
      });

      expect(res.status).toBe(401);
    });

    // Test: Validate required date parameters
    it("should return 400 if date parameters are missing", async () => {
      const token = generateToken();
      const res = await request(app)
        .post("/habit-logs/1/decrement")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          year: 2023,
          // month is missing
          day: 15,
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    // Test: Validate month name format
    it("should return 400 if month name is invalid", async () => {
      const token = generateToken();
      const res = await request(app)
        .post("/habit-logs/1/decrement")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          year: 2023,
          month: "InvalidMonth",
          day: 15,
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    // Test: Handle non-existent log
    it("should return 404 if log not found", async () => {
      jest.spyOn(HabitLog, "findOne").mockResolvedValue(null);

      const token = generateToken();
      const res = await request(app)
        .post("/habit-logs/1/decrement")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          year: 2023,
          month: "June",
          day: 15,
        });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error");
    });

    // Test: Gracefully handle database errors
    it("should handle database errors gracefully", async () => {
      jest
        .spyOn(HabitLog, "findOne")
        .mockRejectedValue(new Error("Database error"));

      const token = generateToken();
      const res = await request(app)
        .post("/habit-logs/1/decrement")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          year: 2023,
          month: "June",
          day: 15,
        });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error");
    });

    // Test: Decrement habit count (skipped for now)
    it.skip("should decrement habit count for a specific date", async () => {
      jest.spyOn(HabitLog, "findOne").mockResolvedValue({
        habitId: 1,
        userId: mockUser.userId,
        date: new Date(2023, 5, 15),
        count: 2,
        save: jest.fn().mockResolvedValue(true),
      } as any);

      const token = generateToken();
      const res = await request(app)
        .post("/habit-logs/1/decrement")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          year: 2023,
          month: "June",
          day: 15,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("2023");
      expect(res.body["2023"]).toHaveProperty("June");
      expect(res.body["2023"]["June"]).toHaveProperty("15", 1);
    });
  });

  // Tests for authorization and access control
  describe("Authorization and Access Control", () => {
    // Test: Prevent accessing another user's habit logs
    it("should prevent accessing another user's habit logs", async () => {
      jest.spyOn(HabitLog, "findAll").mockImplementation((options: any) => {
        if (options?.where?.userId === mockUser.userId) {
          return Promise.resolve([]);
        }
        return Promise.resolve(mockLogs as any);
      });

      const token = generateToken();
      const res = await request(app)
        .get("/habit-logs/999") // Different habit ID
        .set("Cookie", [`accessToken=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({});
    });

    // Test: Prevent incrementing another user's habit
    it("should prevent incrementing another user's habit", async () => {
      jest.spyOn(Habit, "findOne").mockImplementation((options: any) => {
        if (options?.where?.userId === mockUser.userId) {
          return Promise.resolve(null);
        }
        return Promise.resolve(mockHabit as any);
      });

      const token = generateToken();
      const res = await request(app)
        .post("/habit-logs/999/increment") // Different habit ID
        .set("Cookie", [`accessToken=${token}`])
        .send({
          year: 2023,
          month: "June",
          day: 15,
        });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error");
    });

    // Test: Prevent decrementing another user's habit log
    it("should prevent decrementing another user's habit log", async () => {
      jest.spyOn(HabitLog, "findOne").mockImplementation((options: any) => {
        if (options?.where?.userId === mockUser.userId) {
          return Promise.resolve(null);
        }
        return Promise.resolve(mockLogs[0] as any);
      });

      const token = generateToken();
      const res = await request(app)
        .post("/habit-logs/999/decrement") // Different habit ID
        .set("Cookie", [`accessToken=${token}`])
        .send({
          year: 2023,
          month: "June",
          day: 15,
        });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error");
    });
  });
});

afterAll(async () => {
  await sequelize.close();
});
