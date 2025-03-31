import User from "../models/userModel";
import HabitLog from "../models/habitLogModel";
import Habit from "../models/habitModel";
import QuestionnaireResponse from "../models/questionnaireResponseModel";
import sequelize from "../db/db";
import {
  mockUser,
  makeAuthenticatedRequest,
  makeUnauthenticatedRequest,
} from "./utils/testUtils";

// JWT secret for test tokens
process.env.JWT_SECRET = "testsecret";

describe("Profile Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // Test: GET /auth/profile
  describe("GET /auth/profile", () => {
    it("should return user profile for authenticated user", async () => {
      // Mock User.findByPk to return a user
      jest.spyOn(User, "findByPk").mockResolvedValue({
        userId: mockUser.userId,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        isGuest: false,
        avatar: "https://example.com/avatar.jpg",
      } as any);

      const res = await makeAuthenticatedRequest("get", "/auth/profile");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("userId", mockUser.userId);
      expect(res.body).toHaveProperty("firstName", "Test");
      expect(res.body).toHaveProperty("lastName", "User");
      expect(res.body).toHaveProperty("email", "test@example.com");
      expect(res.body).toHaveProperty(
        "avatar",
        "https://example.com/avatar.jpg"
      );
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await makeUnauthenticatedRequest("get", "/auth/profile");
      expect(res.status).toBe(401);
    });

    it("should return 403 if user is a guest", async () => {
      // Mock User.findByPk to return a guest user
      jest.spyOn(User, "findByPk").mockResolvedValue({
        userId: mockUser.userId,
        firstName: "Guest",
        lastName: "User",
        email: "guest@example.com",
        isGuest: true,
      } as any);

      const res = await makeAuthenticatedRequest("get", "/auth/profile");

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("error");
      expect(res.body).toHaveProperty("isGuest", true);
    });
  });

  // Test: PUT /auth/profile
  describe("PUT /auth/profile", () => {
    it("should update avatar successfully", async () => {
      // Mock User.findByPk to return a user
      const mockSave = jest.fn().mockResolvedValue(undefined);
      jest.spyOn(User, "findByPk").mockResolvedValue({
        userId: mockUser.userId,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        isGuest: false,
        avatar: "https://example.com/old-avatar.jpg",
        save: mockSave,
      } as any);

      const newAvatar = "https://example.com/new-avatar.jpg";
      const res = await makeAuthenticatedRequest("put", "/auth/profile", {
        avatar: newAvatar,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("avatar", newAvatar);
      expect(mockSave).toHaveBeenCalled();
    });

    it("should update email successfully", async () => {
      // Mock User.findByPk to return a user
      const mockSave = jest.fn().mockResolvedValue(undefined);
      jest.spyOn(User, "findByPk").mockResolvedValue({
        userId: mockUser.userId,
        firstName: "Test",
        lastName: "User",
        email: "old@example.com",
        isGuest: false,
        save: mockSave,
      } as any);

      // Mock User.findOne to check if email exists
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      const newEmail = "new@example.com";
      const res = await makeAuthenticatedRequest("put", "/auth/profile", {
        email: newEmail,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("email", newEmail);
      expect(mockSave).toHaveBeenCalled();
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await makeUnauthenticatedRequest("put", "/auth/profile", {
        avatar: "https://example.com/avatar.jpg",
      });
      expect(res.status).toBe(401);
    });
  });

  // Test: DELETE /auth/profile
  describe("DELETE /auth/profile", () => {
    it("should delete user account and all associated data", async () => {
      // Mock User.findByPk to return a user with destroy method
      const mockUserDestroy = jest.fn().mockResolvedValue(undefined);
      jest.spyOn(User, "findByPk").mockResolvedValue({
        userId: mockUser.userId,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        isGuest: false,
        destroy: mockUserDestroy,
      } as any);

      // Mock HabitLog.destroy
      const mockHabitLogDestroy = jest.fn().mockResolvedValue(5);
      jest.spyOn(HabitLog, "destroy").mockImplementation(mockHabitLogDestroy);

      // Mock Habit.destroy
      const mockHabitDestroy = jest.fn().mockResolvedValue(3);
      jest.spyOn(Habit, "destroy").mockImplementation(mockHabitDestroy);

      // Mock QuestionnaireResponse.destroy
      const mockQuestionnaireDestroy = jest.fn().mockResolvedValue(1);
      jest
        .spyOn(QuestionnaireResponse, "destroy")
        .mockImplementation(mockQuestionnaireDestroy);

      const res = await makeAuthenticatedRequest("delete", "/auth/profile");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(
        "message",
        "Account deleted successfully"
      );

      // Verify all destroy methods were called with correct userId
      expect(mockHabitLogDestroy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUser.userId },
        })
      );

      expect(mockHabitDestroy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUser.userId },
        })
      );

      expect(mockQuestionnaireDestroy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUser.userId },
        })
      );

      expect(mockUserDestroy).toHaveBeenCalled();
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await makeUnauthenticatedRequest("delete", "/auth/profile");
      expect(res.status).toBe(401);
    });
  });
});
