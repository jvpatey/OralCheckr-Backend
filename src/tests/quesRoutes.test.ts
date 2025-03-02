import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../server";
import QuestionnaireResponse from "../models/questionnaireResponseModel";
import User from "../models/userModel";
import sequelize from "../db/db";

// JWT secret for test tokens
const JWT_SECRET = process.env.JWT_SECRET || "testsecret";

describe("Questionnaire Endpoints", () => {
  let token: string;
  let testUser: any;

  beforeAll(async () => {
    // Create a test user in the database
    testUser = await User.create({
      firstName: "Test",
      lastName: "User",
      email: "testuser@example.com",
      password: "password123",
    });

    // Generate a JWT token for the test user
    token = jwt.sign({ userId: testUser.userId }, JWT_SECRET);
  });

  afterAll(async () => {
    await QuestionnaireResponse.destroy({ where: { userId: testUser.userId } });
    await testUser.destroy();
  });

  describe("POST /questionnaire/response", () => {
    it("should create a new questionnaire response if none exists", async () => {
      const responseData = {
        responses: { 1: 2, 2: [1, 3] },
        totalScore: 85,
      };

      const res = await request(app)
        .post("/questionnaire/response")
        .set("Cookie", [`accessToken=${token}`])
        .send(responseData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty(
        "message",
        "Questionnaire response saved"
      );
      expect(res.body.response).toHaveProperty("currentQuestion", 1);
    });

    it("should update an existing questionnaire response", async () => {
      const responseData = {
        responses: { 1: 3, 2: [2, 3] },
        totalScore: 90,
      };

      const res = await request(app)
        .post("/questionnaire/response")
        .set("Cookie", [`accessToken=${token}`])
        .send(responseData);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty(
        "message",
        "Questionnaire response updated"
      );
      expect(res.body.response).toHaveProperty("totalScore", 90);
      expect(res.body.response).toHaveProperty("currentQuestion", 1);
    });

    // Add error handling tests
    it("should return 401 when no token is provided", async () => {
      const responseData = {
        responses: { 1: 3, 2: [2, 3] },
        totalScore: 90,
      };

      const res = await request(app)
        .post("/questionnaire/response")
        .send(responseData);

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty(
        "error",
        "Unauthorized - No token provided"
      );
    });

    it("should return 400 when required fields are missing", async () => {
      const responseData = {
        // Missing totalScore
        responses: { 1: 3, 2: [2, 3] },
      };

      const res = await request(app)
        .post("/questionnaire/response")
        .set("Cookie", [`accessToken=${token}`])
        .send(responseData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("error", "Missing required fields");
    });

    it("should return 404 when user is not found", async () => {
      // Create a token with a non-existent user ID
      const invalidToken = jwt.sign({ userId: 9999 }, JWT_SECRET);

      const responseData = {
        responses: { 1: 3, 2: [2, 3] },
        totalScore: 90,
      };

      // Mock User.findByPk to return null
      jest.spyOn(User, "findByPk").mockResolvedValueOnce(null);

      const res = await request(app)
        .post("/questionnaire/response")
        .set("Cookie", [`accessToken=${invalidToken}`])
        .send(responseData);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("error", "User not found");
    });
  });

  describe("GET /questionnaire/response", () => {
    it("should retrieve the questionnaire response for the user", async () => {
      const res = await request(app)
        .get("/questionnaire/response")
        .set("Cookie", [`accessToken=${token}`]);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("responses");
      expect(res.body).toHaveProperty("totalScore");
      expect(res.body).toHaveProperty("currentQuestion");
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(app).get("/questionnaire/response");

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty(
        "error",
        "Unauthorized - No token provided"
      );
    });

    it("should return 404 when no response is found for the user", async () => {
      // Create a token with a user ID that has no responses
      const noResponseToken = jwt.sign({ userId: 8888 }, JWT_SECRET);

      // Mock QuestionnaireResponse.findOne to return null
      jest.spyOn(QuestionnaireResponse, "findOne").mockResolvedValueOnce(null);

      const res = await request(app)
        .get("/questionnaire/response")
        .set("Cookie", [`accessToken=${noResponseToken}`]);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty(
        "error",
        "No response found for this user"
      );
    });
  });

  describe("PUT /questionnaire/progress", () => {
    it("should update the questionnaire progress", async () => {
      const progressData = {
        responses: { 1: 2 },
        currentQuestion: 2,
      };

      const res = await request(app)
        .put("/questionnaire/progress")
        .set("Cookie", [`accessToken=${token}`])
        .send(progressData);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty(
        "message",
        "Questionnaire progress updated"
      );
      expect(res.body.progress).toHaveProperty("currentQuestion", 2);
    });

    it("should return 401 when no token is provided", async () => {
      const progressData = {
        responses: { 1: 2 },
        currentQuestion: 2,
      };

      const res = await request(app)
        .put("/questionnaire/progress")
        .send(progressData);

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty(
        "error",
        "Unauthorized - No token provided"
      );
    });

    it("should return 400 when required fields are missing", async () => {
      const progressData = {
        // Missing currentQuestion
        responses: { 1: 2 },
      };

      const res = await request(app)
        .put("/questionnaire/progress")
        .set("Cookie", [`accessToken=${token}`])
        .send(progressData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("error", "Missing required fields");
    });

    it("should create a new record if none exists", async () => {
      // Create a token for a user with no existing progress
      const newUserToken = jwt.sign({ userId: 7777 }, JWT_SECRET);

      // Mock QuestionnaireResponse.findOne to return null
      jest.spyOn(QuestionnaireResponse, "findOne").mockResolvedValueOnce(null);

      // Mock QuestionnaireResponse.create
      jest.spyOn(QuestionnaireResponse, "create").mockResolvedValueOnce({
        userId: 7777,
        responses: { 1: 2 },
        currentQuestion: 2,
      } as any);

      const progressData = {
        responses: { 1: 2 },
        currentQuestion: 2,
      };

      const res = await request(app)
        .put("/questionnaire/progress")
        .set("Cookie", [`accessToken=${newUserToken}`])
        .send(progressData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty(
        "message",
        "Questionnaire progress saved"
      );
    });
  });

  describe("GET /questionnaire/progress", () => {
    it("should retrieve the questionnaire progress for the user", async () => {
      const res = await request(app)
        .get("/questionnaire/progress")
        .set("Cookie", [`accessToken=${token}`]);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("responses");
      expect(res.body).toHaveProperty("currentQuestion");
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(app).get("/questionnaire/progress");

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty(
        "error",
        "Unauthorized - No token provided"
      );
    });

    it("should return 404 when no progress is found for the user", async () => {
      // Create a token with a user ID that has no progress
      const noProgressToken = jwt.sign({ userId: 6666 }, JWT_SECRET);

      // Mock QuestionnaireResponse.findOne to return null
      jest.spyOn(QuestionnaireResponse, "findOne").mockResolvedValueOnce(null);

      const res = await request(app)
        .get("/questionnaire/progress")
        .set("Cookie", [`accessToken=${noProgressToken}`]);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty(
        "error",
        "No progress found for this user"
      );
    });
  });

  // Add tests for guest questionnaire functionality
  describe("POST /questionnaire/guest", () => {
    let guestToken: string;

    beforeEach(() => {
      // Generate a guest token
      guestToken = jwt.sign({ userId: 5555, role: "guest" }, JWT_SECRET);
    });

    it("should save guest questionnaire responses", async () => {
      // Mock QuestionnaireResponse.create
      jest.spyOn(QuestionnaireResponse, "create").mockResolvedValueOnce({
        userId: 5555,
        responses: { 1: 2, 2: [1, 3] },
        totalScore: 75,
      } as any);

      const responseData = {
        responses: { 1: 2, 2: [1, 3] },
        totalScore: 75,
      };

      const res = await request(app)
        .post("/questionnaire/guest")
        .set("Cookie", [`accessToken=${guestToken}`])
        .send(responseData);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Guest responses saved");
    });

    it("should return 401 for non-guest users", async () => {
      // Generate a regular user token
      const regularToken = jwt.sign({ userId: 1, role: "user" }, JWT_SECRET);

      const responseData = {
        responses: { 1: 2, 2: [1, 3] },
        totalScore: 75,
      };

      const res = await request(app)
        .post("/questionnaire/guest")
        .set("Cookie", [`accessToken=${regularToken}`])
        .send(responseData);

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });

    it("should return 401 when no token is provided", async () => {
      const responseData = {
        responses: { 1: 2, 2: [1, 3] },
        totalScore: 75,
      };

      const res = await request(app)
        .post("/questionnaire/guest")
        .send(responseData);

      expect(res.statusCode).toEqual(401);
    });
  });
});

afterAll(async () => {
  await sequelize.close();
});
