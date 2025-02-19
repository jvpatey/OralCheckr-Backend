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
  });
});

afterAll(async () => {
  await sequelize.close();
});
