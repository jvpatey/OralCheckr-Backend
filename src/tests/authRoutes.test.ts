import request from "supertest";
import app from "../server";
import sequelize from "../db/db";
import User from "../models/userModel";
import {
  mockUser,
  makeAuthenticatedRequest,
  makeUnauthenticatedRequest,
  makeGuestRequest,
  expectAuthCookie,
  expectClearedAuthCookie,
  generateHashedPassword,
} from "./utils/testUtils";

/* -- Auth Routes Tests -- */

// JWT secret for tests
process.env.JWT_SECRET = "testsecret";

/* -- Initialize test suite for auth routes -- */
describe("Auth Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test: Register endpoint
  describe("POST /auth/register", () => {
    it("should create a new user successfully", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(null);
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

    // Password test cases
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

    it("should return 401 for non-existent user", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      const res = await request(app).post("/auth/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });

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
    it("should return a guest access token", async () => {
      const res = await request(app).post("/auth/guest-login");

      expectAuthCookie(res);
    });
  });

  // Test: Logout endpoint
  describe("POST /auth/logout", () => {
    it("should log out and clear the accessToken cookie", async () => {
      const res = await request(app).post("/auth/logout");

      expectClearedAuthCookie(res);
    });
  });

  // Test: Validate User endpoint
  describe("GET /auth/validate", () => {
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

    it("should return 401 for invalid token", async () => {
      const res = await request(app)
        .get("/auth/validate")
        .set("Cookie", ["accessToken=invalidtoken"]);

      expect(res.status).toBe(403);
    });

    it("should return 401 when no token is provided", async () => {
      const res = await makeUnauthenticatedRequest("get", "/auth/validate");

      expect(res.status).toBe(401);
    });
  });
});

// Close database connection after tests
afterAll(async () => {
  await sequelize.close();
});
