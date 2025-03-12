import request from "supertest";
import app from "../server";
import sequelize from "../db/db";
import User from "../models/userModel";
import QuestionnaireResponse from "../models/questionnaireResponseModel";

// Import test utilities
import {
  mockUser,
  makeAuthenticatedRequest,
  makeUnauthenticatedRequest,
  makeGuestRequest,
  expectAuthCookie,
  expectClearedAuthCookie,
  generateHashedPassword,
} from "./utils/testUtils";

// Set the JWT secret for tests
process.env.JWT_SECRET = "testsecret";

describe("Auth Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test: Register endpoint
  describe("POST /auth/register", () => {
    // Test: Successfully create a new user
    it("should create a new user successfully", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(null); // No existing user
      jest.spyOn(User, "create").mockResolvedValue({
        userId: 1,
        email: "test@example.com",
      } as any);

      const res = await request(app).post("/auth/register").send({
        email: "test@example.com",
        password: "Password1@",
        firstName: "John",
        lastName: "Doe",
      });

      expectAuthCookie(res);
    });

    // Test: Fail to register when email already exists
    it("should return 409 if the email already exists", async () => {
      jest
        .spyOn(User, "findOne")
        .mockResolvedValue({ email: "test@example.com" } as any);

      const res = await request(app).post("/auth/register").send({
        email: "test@example.com",
        password: "Password1@",
        firstName: "John",
        lastName: "Doe",
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Email already exists");
    });

    // Test: Fail to register when required fields are missing
    it("should return 400 for missing required fields", async () => {
      const res = await request(app).post("/auth/register").send({
        email: "",
        password: "Password1@",
        firstName: "",
        lastName: "Doe",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("All fields are required!");
    });

    // Password validation tests
    const passwordTests = [
      { password: "Ab1@", message: "Password must be at least 8 characters" },
      {
        password: "password1@",
        message: "Must contain at least one uppercase letter",
      },
      {
        password: "PASSWORD1@",
        message: "Must contain at least one lowercase letter",
      },
      { password: "Password@", message: "Must contain at least one digit" },
      {
        password: "Password1",
        message: "Must contain at least one special character",
      },
    ];

    passwordTests.forEach(({ password, message }) => {
      it(`should return 400 if the password validation fails: ${message}`, async () => {
        const res = await request(app).post("/auth/register").send({
          email: "test@example.com",
          password,
          firstName: "John",
          lastName: "Doe",
        });

        console.log("Backend Error:", res.body.error);
        expect(res.status).toBe(400);
        expect(res.body.error).toContain(message);
      });
    });
  });

  // Test: Login endpoint
  describe("POST /auth/login", () => {
    // Test: Successfully log in with correct credentials
    it("should log in successfully with correct credentials", async () => {
      const hashedPassword = await generateHashedPassword("password123");

      jest.spyOn(User, "findOne").mockResolvedValue({
        userId: 1,
        email: "test@example.com",
        password: hashedPassword,
      } as any);

      const res = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expectAuthCookie(res);
    });

    // Test: Fail to login with wrong password
    it("should return 401 for invalid credentials (wrong password)", async () => {
      const hashedPassword = await generateHashedPassword("password123");

      jest.spyOn(User, "findOne").mockResolvedValue({
        userId: 1,
        email: "test@example.com",
        password: hashedPassword,
      } as any);

      const res = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });

    // Test: Fail to login with non-existent user
    it("should return 401 for non-existent user", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      const res = await request(app).post("/auth/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });

    // Test: Fail to login with empty credentials
    it("should return 400 for empty email/password", async () => {
      const res = await request(app).post("/auth/login").send({
        email: "",
        password: "",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Email or Password cannot be empty!");
    });
  });

  // Test: Guest login endpoint
  describe("POST /auth/guest-login", () => {
    // Test: Successfully log in as a guest and receive a token
    it("should return a guest access token", async () => {
      const res = await request(app).post("/auth/guest-login");

      expectAuthCookie(res);
    });
  });

  // Test: Logout endpoint
  describe("POST /auth/logout", () => {
    // Test: Successfully log out and clear the accessToken cookie
    it("should log out and clear the accessToken cookie", async () => {
      const res = await request(app).post("/auth/logout");

      expectClearedAuthCookie(res);
    });
  });

  // Test: Validate User endpoint
  describe("GET /auth/validate", () => {
    // Test: Successfully validate a user with valid token
    it("should validate a user with valid token", async () => {
      jest.spyOn(User, "findByPk").mockResolvedValue({
        userId: mockUser.userId,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      } as any);

      const res = await makeAuthenticatedRequest("get", "/auth/validate");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("userId", mockUser.userId);
    });

    // Test: Fail to validate with invalid token
    it("should return 401 for invalid token", async () => {
      const res = await request(app)
        .get("/auth/validate")
        .set("Cookie", ["accessToken=invalidtoken"]);

      expect(res.status).toBe(403);
    });

    // Test: Fail to validate without token
    it("should return 401 when no token is provided", async () => {
      const res = await makeUnauthenticatedRequest("get", "/auth/validate");

      expect(res.status).toBe(401);
    });
  });

  // Test: Convert Guest to User endpoint
  describe("POST /auth/convert-guest", () => {
    // Test: Successfully convert a guest user to a registered user
    it("should convert a guest user to a registered user", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(null); // No existing user with the email
      jest.spyOn(User, "create").mockResolvedValue({
        userId: 3,
        email: "converted@example.com",
        firstName: "Converted",
        lastName: "User",
        isGuest: false,
      } as any);

      // Mock the QuestionnaireResponse.update method
      jest.spyOn(QuestionnaireResponse, "update").mockResolvedValue([1] as any);

      // Mock the User.destroy method
      jest.spyOn(User, "destroy").mockResolvedValue(1 as any);

      const res = await makeGuestRequest("post", "/auth/convert-guest", {
        email: "converted@example.com",
        password: "Password1@",
        firstName: "Converted",
        lastName: "User",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(
        "message",
        "Guest account successfully converted to permanent account"
      );

      expectAuthCookie(res);
    });

    // Test: Fail to convert when not a guest session
    it("should return 400 if not a guest session", async () => {
      const res = await makeAuthenticatedRequest(
        "post",
        "/auth/convert-guest",
        {
          email: "converted@example.com",
          password: "Password1@",
          firstName: "Converted",
          lastName: "User",
        }
      );

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("No guest session found");
    });

    // Test: Fail to convert when email already exists
    it("should return 409 if email already exists", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue({
        userId: 1,
        email: "existing@example.com",
      } as any);

      const res = await makeGuestRequest("post", "/auth/convert-guest", {
        email: "existing@example.com",
        password: "Password1@",
        firstName: "Converted",
        lastName: "User",
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Email already exists");
    });

    // Test: Fail to convert with missing fields
    it("should return 400 for missing required fields", async () => {
      const res = await makeGuestRequest("post", "/auth/convert-guest", {
        email: "converted@example.com",
        password: "",
        firstName: "",
        lastName: "User",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("All fields are required!");
    });
  });
});

afterAll(async () => {
  await sequelize.close();
});
