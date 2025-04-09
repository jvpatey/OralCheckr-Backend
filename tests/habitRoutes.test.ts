import sequelize from "../src/db/db";
import Habit from "../src/models/habitModel";
import HabitLog from "../src/models/habitLogModel";
import { Model, FindOptions, WhereOptions } from "sequelize";
import {
  mockHabits,
  makeAuthenticatedRequest,
  makeUnauthenticatedRequest,
} from "./utils/testUtils";

type MockHabitAttributes = {
  habitId: number;
  userId: number;
  name: string;
  count: number;
  createdAt?: Date;
  updatedAt?: Date;
};

type MockHabitModel = Model &
  MockHabitAttributes & {
    update?: (data: Partial<MockHabitAttributes>) => Promise<MockHabitModel>;
    destroy?: () => Promise<void>;
    toJSON?: () => MockHabitAttributes;
  };

/* -- Habit Routes Tests -- */

// JWT secret for tests
process.env.JWT_SECRET = "testsecret";

/* -- Initialize test suite for habit routes -- */
describe("Habit Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Tests for the habit GET endpoint
  describe("GET /habits", () => {
    it("should return all habits for the authenticated user", async () => {
      const mockHabitModels = mockHabits.map((habit) => ({
        ...habit,
        toJSON: () => habit,
      })) as unknown as MockHabitModel[];

      jest.spyOn(Habit, "findAll").mockResolvedValue(mockHabitModels);

      const res = await makeAuthenticatedRequest("get", "/habits");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe("Brush teeth");
      expect(res.body[1].name).toBe("Floss");
    });

    it("should return empty array if user has no habits", async () => {
      jest.spyOn(Habit, "findAll").mockResolvedValue([]);

      const res = await makeAuthenticatedRequest("get", "/habits");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // Tests the habit POST endpoint
  describe("POST /habits", () => {
    it("should create a new habit successfully", async () => {
      jest.spyOn(Habit, "findOne").mockResolvedValue(null);

      const mockNewHabit: MockHabitModel = {
        ...mockHabits[0],
        toJSON: () => mockHabits[0],
      } as unknown as MockHabitModel;

      jest.spyOn(Habit, "create").mockResolvedValue(mockNewHabit);

      const res = await makeAuthenticatedRequest("post", "/habits", {
        name: "Brush teeth",
        count: 2,
      });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Brush teeth");
      expect(res.body.count).toBe(2);
    });

    it("should validate input parameters", async () => {
      // Test missing name
      const resMissingName = await makeAuthenticatedRequest("post", "/habits", {
        count: 2,
      });
      expect(resMissingName.status).toBe(400);

      // Test missing count
      const resMissingCount = await makeAuthenticatedRequest(
        "post",
        "/habits",
        {
          name: "Brush teeth",
        }
      );
      expect(resMissingCount.status).toBe(400);

      // Test invalid count
      const resInvalidCount = await makeAuthenticatedRequest(
        "post",
        "/habits",
        {
          name: "Brush teeth",
          count: 0,
        }
      );
      expect(resInvalidCount.status).toBe(400);

      // Test duplicate habit name
      const mockExistingHabit: MockHabitModel = {
        ...mockHabits[0],
      } as unknown as MockHabitModel;

      jest.spyOn(Habit, "findOne").mockResolvedValue(mockExistingHabit);
      const resDuplicateName = await makeAuthenticatedRequest(
        "post",
        "/habits",
        {
          name: "Brush teeth",
          count: 2,
        }
      );
      expect(resDuplicateName.status).toBe(400);
    });
  });

  // Tests the habit PUT endpoint
  describe("PUT /habits/:id", () => {
    it("should update a habit successfully", async () => {
      const updatedHabit: MockHabitAttributes = {
        ...mockHabits[0],
        name: "Brush teeth twice",
        count: 3,
      };

      const mockExistingHabit: MockHabitModel = {
        ...mockHabits[0],
        update: jest.fn().mockResolvedValue(updatedHabit),
        toJSON: () => updatedHabit,
      } as unknown as MockHabitModel;

      jest
        .spyOn(Habit, "findOne")
        .mockImplementation((options?: FindOptions) => {
          const whereClause = options?.where as { habitId?: number };
          if (whereClause?.habitId === 1) {
            return Promise.resolve(mockExistingHabit);
          }
          return Promise.resolve(null);
        });

      const res = await makeAuthenticatedRequest("put", "/habits/1", {
        name: "Brush teeth twice",
        count: 3,
      });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Brush teeth twice");
      expect(res.body.count).toBe(3);
    });

    it("should handle validation and not found errors", async () => {
      // Test habit not found
      jest.spyOn(Habit, "findOne").mockResolvedValue(null);
      const resNotFound = await makeAuthenticatedRequest("put", "/habits/999", {
        name: "Brush teeth twice",
        count: 3,
      });
      expect(resNotFound.status).toBe(404);

      // Test missing name
      const resMissingName = await makeAuthenticatedRequest(
        "put",
        "/habits/1",
        {
          count: 3,
        }
      );
      expect(resMissingName.status).toBe(400);

      // Test missing count
      const resMissingCount = await makeAuthenticatedRequest(
        "put",
        "/habits/1",
        {
          name: "Brush teeth twice",
        }
      );
      expect(resMissingCount.status).toBe(400);

      // Test invalid count
      const resInvalidCount = await makeAuthenticatedRequest(
        "put",
        "/habits/1",
        {
          name: "Brush teeth twice",
          count: 0,
        }
      );
      expect(resInvalidCount.status).toBe(400);

      // Test duplicate habit name
      const mockHabitForUpdate: MockHabitModel = {
        ...mockHabits[0],
        name: "Brush teeth",
      } as unknown as MockHabitModel;

      const mockExistingHabit: MockHabitModel = {
        ...mockHabits[1],
      } as unknown as MockHabitModel;

      jest
        .spyOn(Habit, "findOne")
        .mockImplementation((options?: FindOptions) => {
          const whereClause = options?.where as {
            habitId?: number;
            name?: string;
          };
          if (whereClause?.habitId === 1) {
            return Promise.resolve(mockHabitForUpdate);
          }
          if (whereClause?.name === "Floss") {
            return Promise.resolve(mockExistingHabit);
          }
          return Promise.resolve(null);
        });

      const resDuplicateName = await makeAuthenticatedRequest(
        "put",
        "/habits/1",
        {
          name: "Floss", // Name already exists
          count: 3,
        }
      );
      expect(resDuplicateName.status).toBe(400);
      expect(resDuplicateName.body).toHaveProperty("error");
    });
  });

  // Tests the habit DELETE endpoint
  describe("DELETE /habits/:id", () => {
    it("should delete a habit successfully", async () => {
      const mockHabitToDelete: MockHabitModel = {
        ...mockHabits[0],
        destroy: jest.fn().mockResolvedValue(undefined),
      } as unknown as MockHabitModel;

      jest.spyOn(Habit, "findOne").mockResolvedValue(mockHabitToDelete);
      jest.spyOn(HabitLog, "destroy").mockResolvedValue(2);

      const res = await makeAuthenticatedRequest("delete", "/habits/1");

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("deleted successfully");
    });

    it("should return 404 if habit not found", async () => {
      jest.spyOn(Habit, "findOne").mockResolvedValue(null);

      const res = await makeAuthenticatedRequest("delete", "/habits/999");

      expect(res.status).toBe(404);
    });
  });

  // Tests the habit DELETE all endpoint
  describe("DELETE /habits", () => {
    it("should delete all habits and logs for the user", async () => {
      jest.spyOn(Habit, "destroy").mockResolvedValue(2);
      jest.spyOn(HabitLog, "destroy").mockResolvedValue(5);

      const res = await makeAuthenticatedRequest("delete", "/habits");

      expect(res.status).toBe(200);
      expect(res.body.message).toContain(
        "All habits and their logs deleted successfully"
      );
    });

    it("should return 200 even if no habits exist", async () => {
      jest.spyOn(Habit, "destroy").mockResolvedValue(0);
      jest.spyOn(HabitLog, "destroy").mockResolvedValue(0);

      const res = await makeAuthenticatedRequest("delete", "/habits");

      expect(res.status).toBe(200);
      expect(res.body.message).toContain(
        "All habits and their logs deleted successfully"
      );
    });
  });

  // Tests the common behavior of the habit routes
  describe("Common Behavior", () => {
    it("should require authentication for all endpoints", async () => {
      // GET /habits
      const getRes = await makeUnauthenticatedRequest("get", "/habits");
      expect(getRes.status).toBe(401);

      // POST /habits
      const postRes = await makeUnauthenticatedRequest("post", "/habits", {
        name: "Brush teeth",
        count: 2,
      });
      expect(postRes.status).toBe(401);

      // PUT /habits/:id
      const putRes = await makeUnauthenticatedRequest("put", "/habits/1", {
        name: "Brush teeth twice",
        count: 3,
      });
      expect(putRes.status).toBe(401);

      // DELETE /habits/:id
      const deleteOneRes = await makeUnauthenticatedRequest(
        "delete",
        "/habits/1"
      );
      expect(deleteOneRes.status).toBe(401);

      // DELETE /habits
      const deleteAllRes = await makeUnauthenticatedRequest(
        "delete",
        "/habits"
      );
      expect(deleteAllRes.status).toBe(401);
    });

    // Tests the database error handling
    it("should handle database errors gracefully", async () => {
      // GET /habits
      jest
        .spyOn(Habit, "findAll")
        .mockRejectedValue(new Error("Database error"));
      const getRes = await makeAuthenticatedRequest("get", "/habits");
      expect(getRes.status).toBe(500);
      expect(getRes.body).toHaveProperty("error");

      // POST /habits
      jest.spyOn(Habit, "findOne").mockResolvedValue(null);
      jest
        .spyOn(Habit, "create")
        .mockRejectedValue(new Error("Database error"));
      const postRes = await makeAuthenticatedRequest("post", "/habits", {
        name: "Brush teeth",
        count: 2,
      });
      expect(postRes.status).toBe(500);
      expect(postRes.body).toHaveProperty("error");

      // PUT /habits/:id
      jest
        .spyOn(Habit, "findOne")
        .mockRejectedValue(new Error("Database error"));
      const putRes = await makeAuthenticatedRequest("put", "/habits/1", {
        name: "Brush teeth twice",
        count: 3,
      });
      expect(putRes.status).toBe(500);
      expect(putRes.body).toHaveProperty("error");

      // DELETE /habits/:id
      jest
        .spyOn(Habit, "findOne")
        .mockRejectedValue(new Error("Database error"));
      const deleteOneRes = await makeAuthenticatedRequest(
        "delete",
        "/habits/1"
      );
      expect(deleteOneRes.status).toBe(500);
      expect(deleteOneRes.body).toHaveProperty("error");

      // DELETE /habits
      jest
        .spyOn(HabitLog, "destroy")
        .mockRejectedValue(new Error("Database error"));
      const deleteAllRes = await makeAuthenticatedRequest("delete", "/habits");
      expect(deleteAllRes.status).toBe(500);
      expect(deleteAllRes.body).toHaveProperty("error");
    });

    // Tests the authorization and access control
    it("should enforce proper authorization and access control", async () => {
      // Prevent accessing another user's habit
      jest.spyOn(Habit, "findOne").mockResolvedValue(null);
      const putRes = await makeAuthenticatedRequest("put", "/habits/1", {
        name: "Brush teeth twice",
        count: 3,
      });
      expect(putRes.status).toBe(404);
      expect(putRes.body).toHaveProperty("error", "Habit not found");

      // Prevent deleting another user's habit
      const deleteRes = await makeAuthenticatedRequest("delete", "/habits/1");
      expect(deleteRes.status).toBe(404);
      expect(deleteRes.body).toHaveProperty("error", "Habit not found");
    });
  });
});

// Close the database connection after all tests
afterAll(async () => {
  await sequelize.close();
});
