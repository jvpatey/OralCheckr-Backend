import request from "supertest";
import app from "../server";
import bcrypt from "bcryptjs";

// Mocking the environment variable for JWT secret
process.env.JWT_SECRET = "testsecret";

// Mock database
jest.mock("../models/userModel", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

const mockedUserModel = require("../models/userModel");

describe("Auth Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test: Register endpoint
  describe("POST /auth/register", () => {
    it("should create a new user successfully", async () => {
      mockedUserModel.findOne.mockResolvedValue(null); // No existing user
      mockedUserModel.create.mockResolvedValue({
        userId: 1,
        email: "test@example.com",
      });

      const res = await request(app).post("/auth/register").send({
        email: "test@example.com",
        password: "Test@1234",
        firstName: "John",
        lastName: "Doe",
      });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("User created successfully");
      expect(res.body).toHaveProperty("accessToken");
    });

    it("should return 409 if the email already exists", async () => {
      mockedUserModel.findOne.mockResolvedValue({ email: "test@example.com" }); // User exists

      const res = await request(app).post("/auth/register").send({
        email: "test@example.com",
        password: "Test@1234",
        firstName: "John",
        lastName: "Doe",
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Email already exists");
    });

    it("should return 400 for invalid or missing fields", async () => {
      const res = await request(app).post("/auth/register").send({
        email: "", // Missing email
        password: "Test@1234",
        firstName: "John",
        lastName: "Doe",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("All fields are required!");
    });
  });

  // Test: Login endpoint
  describe("POST /auth/login", () => {
    it("should log in successfully with correct credentials", async () => {
      mockedUserModel.findOne.mockResolvedValue({
        userId: 1,
        email: "test@example.com",
        password: await bcrypt.hash("password123", 10), // Mocked hashed password
      });

      const res = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body.userId).toBe(1);
    });

    it("should return 401 for invalid credentials", async () => {
      mockedUserModel.findOne.mockResolvedValue(null); // No user found

      const res = await request(app).post("/auth/login").send({
        email: "wrong@example.com",
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });
  });

  // Test: Guest login endpoint
  describe("POST /auth/guest-login", () => {
    it("should return a guest access token", async () => {
      const res = await request(app).post("/auth/guest-login");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Guest login successful");
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body.userID).toBe("Guest");
    });
  });
});
