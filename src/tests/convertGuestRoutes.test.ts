import User from "../models/userModel";
import QuestionnaireResponse from "../models/questionnaireResponseModel";
import Habit from "../models/habitModel";
import HabitLog from "../models/habitLogModel";
import sequelize from "../db/db";
import {
  makeGuestRequest,
  makeUnauthenticatedRequest,
} from "./utils/testUtils";

// JWT secret for test tokens
process.env.JWT_SECRET = "testsecret";

describe("Convert Guest Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // Test: POST /auth/convert-guest
  describe("POST /auth/convert-guest", () => {
    it("should convert guest to permanent user and migrate data", async () => {
      // Mock User.findOne to check email existence - returning null means email is available
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      // Mock User.create to return a new permanent user
      jest.spyOn(User, "create").mockResolvedValue({
        userId: 999,
        email: "converted@example.com",
        firstName: "Converted",
        lastName: "User",
        isGuest: false,
      } as any);

      // Mock QuestionnaireResponse.update
      const mockQuestionnaireUpdate = jest.fn().mockResolvedValue([1]);
      jest
        .spyOn(QuestionnaireResponse, "update")
        .mockImplementation(mockQuestionnaireUpdate);

      // Mock Habit.update
      const mockHabitUpdate = jest.fn().mockResolvedValue([2]);
      jest.spyOn(Habit, "update").mockImplementation(mockHabitUpdate);

      // Mock HabitLog.update
      const mockHabitLogUpdate = jest.fn().mockResolvedValue([3]);
      jest.spyOn(HabitLog, "update").mockImplementation(mockHabitLogUpdate);

      // Mock Habit.count
      jest.spyOn(Habit, "count").mockResolvedValue(2);

      // Mock HabitLog.count
      jest.spyOn(HabitLog, "count").mockResolvedValue(3);

      // Mock User.destroy
      const mockUserDestroy = jest.fn().mockResolvedValue(1);
      jest.spyOn(User, "destroy").mockImplementation(mockUserDestroy);

      const res = await makeGuestRequest("post", "/auth/convert-guest", {
        email: "converted@example.com",
        password: "Password123!",
        firstName: "Converted",
        lastName: "User",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(
        "message",
        "Guest account successfully converted to permanent account"
      );
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("email", "converted@example.com");
      expect(res.body.user).toHaveProperty("isGuest", false);
      expect(res.body).toHaveProperty("habitsMigrated", 2);
      expect(res.body).toHaveProperty("logsMigrated", 3);

      // Verify data migration calls
      expect(mockQuestionnaireUpdate).toHaveBeenCalled();
      expect(mockHabitUpdate).toHaveBeenCalled();
      expect(mockHabitLogUpdate).toHaveBeenCalled();
      expect(mockUserDestroy).toHaveBeenCalled();

      // Should have a cookie set
      expect(res.headers["set-cookie"]).toBeDefined();
      expect(res.headers["set-cookie"][0]).toContain("accessToken=");
    });

    it("should return 400 for missing required fields", async () => {
      const res = await makeGuestRequest("post", "/auth/convert-guest", {
        email: "converted@example.com",
        // Missing password
        firstName: "Converted",
        lastName: "User",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "All fields are required!");
    });

    it("should return 409 for existing email", async () => {
      // Mock User.findOne to check email existence - email already exists
      jest.spyOn(User, "findOne").mockResolvedValue({
        userId: 123,
        email: "existing@example.com",
      } as any);

      const res = await makeGuestRequest("post", "/auth/convert-guest", {
        email: "existing@example.com",
        password: "Password123!",
        firstName: "Converted",
        lastName: "User",
      });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty("error", "Email already exists");
    });

    it("should return 401 if not authenticated", async () => {
      const res = await makeUnauthenticatedRequest(
        "post",
        "/auth/convert-guest",
        {
          email: "converted@example.com",
          password: "Password123!",
          firstName: "Converted",
          lastName: "User",
        }
      );

      expect(res.status).toBe(401);
    });
  });
});
