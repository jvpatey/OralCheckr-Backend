import request from "supertest";
import app from "../server";
import bcrypt from "bcryptjs";

// Mocking the environment variable for JWT secret
process.env.JWT_SECRET = "testsecret";

// Mock database
jest.mock("../models/userModel", () => ({
  findOne: jest.fn(), // Search for user
  create: jest.fn(), // User creation
}));

const mockedUserModel = require("../models/userModel");

describe("Auth Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test: Register endpoint
  describe("POST /auth/register", () => {
    // Test: Successfully create a new user
    it("should create a new user successfully", async () => {
      mockedUserModel.findOne.mockResolvedValue(null); // No existing user
      mockedUserModel.create.mockResolvedValue({
        userId: 1,
        email: "test@example.com",
      });

      const res = await request(app).post("/auth/register").send({
        email: "test@example.com",
        password: "Password1@",
        firstName: "John",
        lastName: "Doe",
      });

      const cookies = res.headers["set-cookie"];
      expect(Array.isArray(cookies)).toBe(true);
      expect(
        cookies &&
          Array.isArray(cookies) &&
          cookies.some((cookie: string) => cookie.startsWith("accessToken="))
      ).toBe(true);
    });

    // Test: Fail to register when email already exists
    it("should return 409 if the email already exists", async () => {
      mockedUserModel.findOne.mockResolvedValue({ email: "test@example.com" });

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

        console.log("Backend Error:", res.body.error); // Debugging message
        expect(res.status).toBe(400);
        expect(res.body.error).toContain(message);
      });
    });
  });

  // Test: Login endpoint
  describe("POST /auth/login", () => {
    // Test: Successfully log in with correct credentials
    it("should log in successfully with correct credentials", async () => {
      mockedUserModel.findOne.mockResolvedValue({
        userId: 1,
        email: "test@example.com",
        password: await bcrypt.hash("password123", 10),
      });

      const res = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      const cookies = res.headers["set-cookie"];
      expect(Array.isArray(cookies)).toBe(true);
      expect(
        cookies &&
          Array.isArray(cookies) &&
          cookies.some((cookie: string) => cookie.startsWith("accessToken="))
      ).toBe(true);
    });
  });

  // Test: Guest login endpoint
  describe("POST /auth/guest-login", () => {
    // Test: Successfully log in as a guest and receive a token
    it("should return a guest access token", async () => {
      const res = await request(app).post("/auth/guest-login");

      const cookies = res.headers["set-cookie"];
      expect(Array.isArray(cookies)).toBe(true);
      expect(
        cookies &&
          Array.isArray(cookies) &&
          cookies.some((cookie: string) => cookie.startsWith("accessToken="))
      ).toBe(true);
    });
  });

  // Test: Logout endpoint
  describe("POST /auth/logout", () => {
    // Test: Successfully log out and clear the accessToken cookie
    it("should log out and clear the accessToken cookie", async () => {
      const res = await request(app).post("/auth/logout");

      const cookies = res.headers["set-cookie"];
      expect(Array.isArray(cookies)).toBe(true);
      expect(
        cookies &&
          Array.isArray(cookies) &&
          cookies.some((cookie: string) => cookie.startsWith("accessToken=;"))
      ).toBe(true);
    });
  });
});
