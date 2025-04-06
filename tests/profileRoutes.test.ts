import User from "../src/models/userModel";
import HabitLog from "../src/models/habitLogModel";
import Habit from "../src/models/habitModel";
import QuestionnaireResponse from "../src/models/questionnaireResponseModel";
import sequelize from "../src/db/db";
import {
  mockUser,
  makeAuthenticatedRequest,
  makeUnauthenticatedRequest,
} from "./utils/testUtils";

/* -- Profile Routes Tests -- */

// JWT secret for test tokens
process.env.JWT_SECRET = "testsecret";

/* -- Initialize test suite for profile routes -- */
describe("Profile Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // Tests the profile GET endpoint
  describe("GET /auth/profile", () => {
    it("should return user profile for authenticated user", async () => {
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

  // Tests the profile PUT endpoint
  describe("PUT /auth/profile", () => {
    it("should update avatar successfully", async () => {
      const newAvatar = "https://example.com/new-avatar.jpg";
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const findByPkMock = jest.spyOn(User, "findByPk");

      // First call returns user with old avatar
      findByPkMock.mockResolvedValueOnce({
        userId: mockUser.userId,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        isGuest: false,
        avatar: "https://example.com/old-avatar.jpg",
        update: mockUpdate,
      } as any);

      // Second call returns user with new avatar
      findByPkMock.mockResolvedValueOnce({
        userId: mockUser.userId,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        isGuest: false,
        avatar: newAvatar,
      } as any);

      const res = await makeAuthenticatedRequest("put", "/auth/profile", {
        avatar: newAvatar,
      });

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty("avatar", newAvatar);
      expect(mockUpdate).toHaveBeenCalledWith({ avatar: newAvatar });
    });

    it("should update email successfully", async () => {
      const newEmail = "new@example.com";
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const findByPkMock = jest.spyOn(User, "findByPk");

      // First call returns user with old email
      findByPkMock.mockResolvedValueOnce({
        userId: mockUser.userId,
        firstName: "Test",
        lastName: "User",
        email: "old@example.com",
        isGuest: false,
        update: mockUpdate,
      } as any);

      // Second call returns user with new email
      findByPkMock.mockResolvedValueOnce({
        userId: mockUser.userId,
        firstName: "Test",
        lastName: "User",
        email: newEmail,
        isGuest: false,
      } as any);

      jest.spyOn(User, "findOne").mockResolvedValue(null);

      const res = await makeAuthenticatedRequest("put", "/auth/profile", {
        email: newEmail,
      });

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty("email", newEmail);
      expect(mockUpdate).toHaveBeenCalledWith({ email: newEmail });
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await makeUnauthenticatedRequest("put", "/auth/profile", {
        avatar: "https://example.com/avatar.jpg",
      });
      expect(res.status).toBe(401);
    });
  });

  // Tests the profile DELETE endpoint
  describe("DELETE /auth/profile", () => {
    it("should delete user account and all associated data", async () => {
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

      // Verify Habit.destroy was called with correct userId
      expect(mockHabitDestroy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUser.userId },
        })
      );

      // Verify QuestionnaireResponse.destroy was called with correct userId
      expect(mockQuestionnaireDestroy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUser.userId },
        })
      );

      // Verify User.destroy was called
      expect(mockUserDestroy).toHaveBeenCalled();
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await makeUnauthenticatedRequest("delete", "/auth/profile");
      expect(res.status).toBe(401);
    });
  });
});
