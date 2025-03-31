import { OAuth2Client } from "google-auth-library";
import User from "../models/userModel";
import sequelize from "../db/db";
import request from "supertest";
import app from "../server";
import { mockUser } from "./utils/testUtils";

/* -- Google Auth Routes Tests -- */

// Mock OAuth2Client
jest.mock("google-auth-library", () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => {
      return {
        verifyIdToken: jest.fn().mockImplementation(({ idToken }) => {
          if (idToken === "valid_token") {
            return {
              getPayload: () => ({
                email: "google@example.com",
                given_name: "Google",
                family_name: "User",
                sub: "google_id_123",
              }),
            };
          } else {
            throw new Error("Invalid token");
          }
        }),
      };
    }),
  };
});

// JWT secret for test tokens
process.env.JWT_SECRET = "testsecret";
process.env.GOOGLE_CLIENT_ID = "test_client_id";

/* -- Initialize test suite for google auth routes -- */
describe("Google Auth Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // Test for google login endpoint
  describe("POST /auth/google-login", () => {
    it("should login successfully with valid Google credentials for new user", async () => {
      // Mock that no existing user is found
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      // Mock user creation
      jest.spyOn(User, "create").mockResolvedValue({
        userId: 999,
        email: "google@example.com",
        firstName: "Google",
        lastName: "User",
        googleId: "google_id_123",
      } as any);

      // Make request
      const res = await request(app)
        .post("/auth/google-login")
        .send({ token: "valid_token" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Google login successful");
      expect(res.body.user).toHaveProperty("userId", 999);

      // Should have a cookie set
      expect(res.headers["set-cookie"]).toBeDefined();
      expect(res.headers["set-cookie"][0]).toContain("accessToken=");
    });

    it("should login successfully and update googleId for existing user", async () => {
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      jest.spyOn(User, "findOne").mockResolvedValue({
        userId: mockUser.userId,
        email: "google@example.com",
        firstName: "Test",
        lastName: "User",
        googleId: undefined,
        avatar: undefined,
        update: mockUpdate,
      } as any);

      const res = await request(app)
        .post("/auth/google-login")
        .send({ token: "valid_token" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Google login successful");
      expect(res.body.user).toHaveProperty("userId", mockUser.userId);
      expect(mockUpdate).toHaveBeenCalledWith({
        googleId: "google_id_123",
        avatar: undefined,
      });
    });

    it("should return 400 for missing token", async () => {
      const res = await request(app).post("/auth/google-login").send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "Token is required");
    });

    it("should return 500 for invalid token", async () => {
      const res = await request(app)
        .post("/auth/google-login")
        .send({ token: "invalid_token" });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty(
        "error",
        "Failed to authenticate with Google"
      );
    });
  });
});
