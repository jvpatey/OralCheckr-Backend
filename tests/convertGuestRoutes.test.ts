import User from "../src/models/userModel";
import QuestionnaireResponse from "../src/models/questionnaireResponseModel";
import Habit from "../src/models/habitModel";
import HabitLog from "../src/models/habitLogModel";
import sequelize from "../src/db/db";
import {
  makeGuestRequest,
  makeUnauthenticatedRequest,
  makeAuthenticatedRequest,
} from "./utils/testUtils";

/* -- Convert Guest Routes Tests -- */

/* -- Initialize test suite for convert guest routes -- */
describe("Convert Guest Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // Test: POST /auth/convert-guest
  describe("POST /auth/convert-guest", () => {
    it("should convert guest to permanent user successfully", async () => {
      // Mock that no existing user is found
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      // Mock user creation
      jest.spyOn(User, "create").mockResolvedValue({
        userId: 999,
        email: "converted@example.com",
        firstName: "Converted",
        lastName: "User",
        isGuest: false,
      } as any);

      // Mock data migration
      jest.spyOn(QuestionnaireResponse, "update").mockResolvedValue([1] as any);
      jest.spyOn(Habit, "update").mockResolvedValue([1] as any);
      jest.spyOn(HabitLog, "update").mockResolvedValue([1] as any);
      jest.spyOn(User, "destroy").mockResolvedValue(1 as any);

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
      expect(res.body.user).toHaveProperty("email", "converted@example.com");
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
      expect(res.body.error).toBe("All fields are required!");
    });

    it("should return 409 if email already exists", async () => {
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
      expect(res.body.error).toBe("Email already exists");
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

    it("should return 400 if not a guest session", async () => {
      const res = await makeAuthenticatedRequest(
        "post",
        "/auth/convert-guest",
        {
          email: "converted@example.com",
          password: "Password123!",
          firstName: "Converted",
          lastName: "User",
        }
      );

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("No guest session found");
    });
  });
});
