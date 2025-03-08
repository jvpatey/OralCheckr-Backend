import request from "supertest";
import app from "../server";
import sequelize from "../db/db";
import jwt from "jsonwebtoken";
import Habit from "../models/habitModel";
import HabitLog from "../models/habitLogModel";
import User from "../models/userModel";

process.env.JWT_SECRET = "testsecret";

describe("Habit Routes", () => {
  // Test user
  const mockUser = {
    userId: 1,
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
  };

  // Auth token generator
  const generateToken = () => {
    return jwt.sign({ userId: mockUser.userId }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });
  };

  // Sample habits
  const mockHabits = [
    { habitId: 1, name: "Brush teeth", count: 2, userId: mockUser.userId },
    { habitId: 2, name: "Floss", count: 1, userId: mockUser.userId },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // GET /habits
  describe("GET /habits", () => {
    it("should return all habits for the authenticated user", async () => {
      jest.spyOn(Habit, "findAll").mockResolvedValue(mockHabits as any);

      const token = generateToken();
      const res = await request(app)
        .get("/habits")
        .set("Cookie", [`accessToken=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe("Brush teeth");
      expect(res.body[1].name).toBe("Floss");
    });

    it("should return 401 if not authenticated", async () => {
      const res = await request(app).get("/habits");
      expect(res.status).toBe(401);
    });

    it("should return empty array if user has no habits", async () => {
      jest.spyOn(Habit, "findAll").mockResolvedValue([]);

      const token = generateToken();
      const res = await request(app)
        .get("/habits")
        .set("Cookie", [`accessToken=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should handle database errors gracefully", async () => {
      jest
        .spyOn(Habit, "findAll")
        .mockRejectedValue(new Error("Database error"));

      const token = generateToken();
      const res = await request(app)
        .get("/habits")
        .set("Cookie", [`accessToken=${token}`]);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error");
    });
  });

  // POST /habits
  describe("POST /habits", () => {
    it("should create a new habit successfully", async () => {
      jest.spyOn(Habit, "findOne").mockResolvedValue(null);
      jest.spyOn(Habit, "create").mockResolvedValue({
        ...mockHabits[0],
        toJSON: () => mockHabits[0],
      } as any);

      const token = generateToken();
      const res = await request(app)
        .post("/habits")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          name: "Brush teeth",
          count: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Brush teeth");
      expect(res.body.count).toBe(2);
    });

    it("should return 400 if name is missing", async () => {
      const token = generateToken();
      const res = await request(app)
        .post("/habits")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          count: 2,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 if count is missing", async () => {
      const token = generateToken();
      const res = await request(app)
        .post("/habits")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          name: "Brush teeth",
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 if count is less than 1", async () => {
      const token = generateToken();
      const res = await request(app)
        .post("/habits")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          name: "Brush teeth",
          count: 0,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 if habit with same name already exists", async () => {
      jest.spyOn(Habit, "findOne").mockResolvedValue(mockHabits[0] as any);

      const token = generateToken();
      const res = await request(app)
        .post("/habits")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          name: "Brush teeth",
          count: 2,
        });

      expect(res.status).toBe(400);
    });

    it("should handle database errors gracefully", async () => {
      jest.spyOn(Habit, "findOne").mockResolvedValue(null);
      jest
        .spyOn(Habit, "create")
        .mockRejectedValue(new Error("Database error"));

      const token = generateToken();
      const res = await request(app)
        .post("/habits")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          name: "Brush teeth",
          count: 2,
        });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error");
    });
  });

  // PUT /habits/:id
  describe("PUT /habits/:id", () => {
    it("should update a habit successfully", async () => {
      jest.spyOn(Habit, "findOne").mockImplementation((options: any) => {
        // Return habit for update or null for duplicate check
        if (options?.where?.habitId === 1) {
          return Promise.resolve({
            ...mockHabits[0],
            update: jest.fn().mockImplementation(() => {
              const updatedHabit = {
                ...mockHabits[0],
                name: "Brush teeth twice",
                count: 3,
              };
              return Promise.resolve(updatedHabit);
            }),
            toJSON: () => ({
              ...mockHabits[0],
              name: "Brush teeth twice",
              count: 3,
            }),
          } as any);
        }
        return Promise.resolve(null);
      });

      const token = generateToken();
      const res = await request(app)
        .put("/habits/1")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          name: "Brush teeth twice",
          count: 3,
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Brush teeth twice");
      expect(res.body.count).toBe(3);
    });

    it("should return 404 if habit not found", async () => {
      jest.spyOn(Habit, "findOne").mockResolvedValue(null);

      const token = generateToken();
      const res = await request(app)
        .put("/habits/999")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          name: "Brush teeth twice",
          count: 3,
        });

      expect(res.status).toBe(404);
    });

    it("should return 400 if name is missing", async () => {
      const token = generateToken();
      const res = await request(app)
        .put("/habits/1")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          count: 3,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 if count is missing", async () => {
      const token = generateToken();
      const res = await request(app)
        .put("/habits/1")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          name: "Brush teeth twice",
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 if count is less than 1", async () => {
      const token = generateToken();
      const res = await request(app)
        .put("/habits/1")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          name: "Brush teeth twice",
          count: 0,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 if another habit with the same name exists", async () => {
      jest.spyOn(Habit, "findOne").mockImplementation((options: any) => {
        // Return habit for update
        if (options?.where?.habitId === 1) {
          return Promise.resolve({
            ...mockHabits[0],
            name: "Brush teeth",
          } as any);
        }
        // Return existing habit for duplicate check
        if (options?.where?.name === "Floss") {
          return Promise.resolve(mockHabits[1] as any);
        }
        return Promise.resolve(null);
      });

      const token = generateToken();
      const res = await request(app)
        .put("/habits/1")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          name: "Floss", // Name already exists
          count: 3,
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should handle database errors gracefully", async () => {
      jest
        .spyOn(Habit, "findOne")
        .mockRejectedValue(new Error("Database error"));

      const token = generateToken();
      const res = await request(app)
        .put("/habits/1")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          name: "Brush teeth twice",
          count: 3,
        });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error");
    });
  });

  // DELETE /habits/:id
  describe("DELETE /habits/:id", () => {
    it("should delete a habit successfully", async () => {
      jest.spyOn(Habit, "findOne").mockResolvedValue({
        ...mockHabits[0],
        destroy: jest.fn().mockResolvedValue(undefined),
      } as any);

      jest.spyOn(HabitLog, "destroy").mockResolvedValue(2 as any);

      const token = generateToken();
      const res = await request(app)
        .delete("/habits/1")
        .set("Cookie", [`accessToken=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("deleted successfully");
    });

    it("should return 404 if habit not found", async () => {
      jest.spyOn(Habit, "findOne").mockResolvedValue(null);

      const token = generateToken();
      const res = await request(app)
        .delete("/habits/999")
        .set("Cookie", [`accessToken=${token}`]);

      expect(res.status).toBe(404);
    });

    it("should handle database errors gracefully", async () => {
      jest
        .spyOn(Habit, "findOne")
        .mockRejectedValue(new Error("Database error"));

      const token = generateToken();
      const res = await request(app)
        .delete("/habits/1")
        .set("Cookie", [`accessToken=${token}`]);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error");
    });

    it("should handle errors when deleting associated logs", async () => {
      jest.spyOn(Habit, "findOne").mockResolvedValue(mockHabits[0] as any);
      jest
        .spyOn(HabitLog, "destroy")
        .mockRejectedValue(new Error("Database error"));

      const token = generateToken();
      const res = await request(app)
        .delete("/habits/1")
        .set("Cookie", [`accessToken=${token}`]);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error");
    });
  });

  // DELETE /habits
  describe("DELETE /habits", () => {
    it("should delete all habits and logs for the user", async () => {
      jest.spyOn(Habit, "destroy").mockResolvedValue(2 as any);
      jest.spyOn(HabitLog, "destroy").mockResolvedValue(5 as any);

      const token = generateToken();
      const res = await request(app)
        .delete("/habits")
        .set("Cookie", [`accessToken=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain(
        "All habits and their logs deleted successfully"
      );
    });

    it("should return 200 even if no habits exist", async () => {
      jest.spyOn(Habit, "destroy").mockResolvedValue(0 as any);
      jest.spyOn(HabitLog, "destroy").mockResolvedValue(0 as any);

      const token = generateToken();
      const res = await request(app)
        .delete("/habits")
        .set("Cookie", [`accessToken=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain(
        "All habits and their logs deleted successfully"
      );
    });

    it("should handle database errors gracefully", async () => {
      jest
        .spyOn(HabitLog, "destroy")
        .mockRejectedValue(new Error("Database error"));

      const token = generateToken();
      const res = await request(app)
        .delete("/habits")
        .set("Cookie", [`accessToken=${token}`]);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error");
    });
  });

  // Authorization tests
  describe("Authorization and Access Control", () => {
    it("should prevent accessing another user's habit", async () => {
      jest.spyOn(Habit, "findOne").mockResolvedValue(null);

      const token = generateToken();
      const res = await request(app)
        .put("/habits/1")
        .set("Cookie", [`accessToken=${token}`])
        .send({
          name: "Brush teeth twice",
          count: 3,
        });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Habit not found");
    });

    it("should prevent deleting another user's habit", async () => {
      jest.spyOn(Habit, "findOne").mockResolvedValue(null);

      const token = generateToken();
      const res = await request(app)
        .delete("/habits/1")
        .set("Cookie", [`accessToken=${token}`]);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Habit not found");
    });
  });
});

afterAll(async () => {
  await sequelize.close();
});
