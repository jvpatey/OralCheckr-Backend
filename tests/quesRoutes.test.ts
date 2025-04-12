import QuestionnaireResponse from "../src/models/questionnaireResponseModel";
import User from "../src/models/userModel";
import sequelize from "../src/db/db";
import { Model } from "sequelize";
import {
  mockUser,
  mockGuestUser,
  mockQuestionnaireData,
  makeAuthenticatedRequest,
  makeUnauthenticatedRequest,
  makeGuestRequest,
  expectQuestionnaireProperties,
} from "./utils/testUtils";

type MockQuestionnaireAttributes = {
  userId: number;
  responses: { [key: number]: number | number[] };
  totalScore?: number;
  currentQuestion?: number;
};

type MockQuestionnaireModel = Model &
  MockQuestionnaireAttributes & {
    update?: (
      data: Partial<MockQuestionnaireAttributes>
    ) => Promise<MockQuestionnaireModel>;
    toJSON?: () => MockQuestionnaireAttributes;
  };

/* -- Questionnaire Routes Tests -- */

// JWT secret for test tokens
process.env.JWT_SECRET = "testsecret";

/* -- Initialize test suite for questionnaire routes -- */
describe("Questionnaire Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // Tests the questionnaire response POST endpoint
  describe("POST /questionnaire/response", () => {
    it("should create a new questionnaire response if none exists", async () => {
      jest
        .spyOn(User, "findByPk")
        .mockResolvedValue(mockUser as unknown as Model);
      jest.spyOn(QuestionnaireResponse, "findOne").mockResolvedValue(null);

      const mockResponseData: MockQuestionnaireModel = {
        userId: mockUser.userId,
        responses: mockQuestionnaireData.responses,
        totalScore: mockQuestionnaireData.totalScore,
        currentQuestion: 1,
      } as unknown as MockQuestionnaireModel;

      jest
        .spyOn(QuestionnaireResponse, "create")
        .mockResolvedValue(mockResponseData);

      const res = await makeAuthenticatedRequest(
        "post",
        "/questionnaire/response",
        mockQuestionnaireData
      );

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty(
        "message",
        "Questionnaire response saved"
      );
      expect(res.body.response).toHaveProperty("currentQuestion", 1);
    });

    it("should update an existing questionnaire response", async () => {
      jest
        .spyOn(User, "findByPk")
        .mockResolvedValue(mockUser as unknown as Model);

      const updatedResponse: MockQuestionnaireAttributes = {
        userId: mockUser.userId,
        responses: { 1: 3, 2: [2, 3] },
        totalScore: 90,
        currentQuestion: 1,
      };

      const mockExistingResponse: MockQuestionnaireModel = {
        userId: mockUser.userId,
        responses: { 1: 2, 2: [1, 3] },
        totalScore: 85,
        currentQuestion: 1,
        update: jest.fn().mockResolvedValue(updatedResponse),
        toJSON: () => updatedResponse,
      } as unknown as MockQuestionnaireModel;

      jest
        .spyOn(QuestionnaireResponse, "findOne")
        .mockResolvedValue(mockExistingResponse);

      const responseData = {
        responses: { 1: 3, 2: [2, 3] },
        totalScore: 90,
      };

      const res = await makeAuthenticatedRequest(
        "post",
        "/questionnaire/response",
        responseData
      );

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty(
        "message",
        "Questionnaire response updated"
      );
      expect(res.body.response).toHaveProperty("totalScore", 90);
      expect(res.body.response).toHaveProperty("currentQuestion", 1);
    });

    it("should return 401 when no token is provided", async () => {
      const responseData = {
        responses: { 1: 3, 2: [2, 3] },
        totalScore: 90,
      };

      const res = await makeUnauthenticatedRequest(
        "post",
        "/questionnaire/response",
        responseData
      );

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty(
        "error",
        "Unauthorized: No token provided"
      );
    });

    it("should return 400 when required fields are missing", async () => {
      jest
        .spyOn(User, "findByPk")
        .mockResolvedValue(mockUser as unknown as Model);

      const responseData = {
        responses: { 1: 3, 2: [2, 3] },
      };

      const res = await makeAuthenticatedRequest(
        "post",
        "/questionnaire/response",
        responseData
      );

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("error", "Missing required fields");
    });

    it("should return 404 when user is not found", async () => {
      const responseData = {
        responses: { 1: 3, 2: [2, 3] },
        totalScore: 90,
      };

      jest.spyOn(User, "findByPk").mockResolvedValueOnce(null);
      const res = await makeAuthenticatedRequest(
        "post",
        "/questionnaire/response",
        responseData,
        9999
      );

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty("error", "User not found");
    });
  });

  // Tests the questionnaire response GET endpoint
  describe("GET /questionnaire/response", () => {
    it("should retrieve the questionnaire response for the user", async () => {
      const mockResponseData: MockQuestionnaireModel = {
        userId: mockUser.userId,
        responses: mockQuestionnaireData.responses,
        totalScore: mockQuestionnaireData.totalScore,
        currentQuestion: mockQuestionnaireData.currentQuestion,
      } as unknown as MockQuestionnaireModel;

      jest
        .spyOn(QuestionnaireResponse, "findOne")
        .mockResolvedValue(mockResponseData);

      const res = await makeAuthenticatedRequest(
        "get",
        "/questionnaire/response"
      );

      expect(res.statusCode).toEqual(200);
      expectQuestionnaireProperties(res.body);
    });

    it("should return 401 when no token is provided", async () => {
      const res = await makeUnauthenticatedRequest(
        "get",
        "/questionnaire/response"
      );

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty(
        "error",
        "Unauthorized: No token provided"
      );
    });

    it("should return 404 when no response is found for the user", async () => {
      jest.spyOn(QuestionnaireResponse, "findOne").mockResolvedValueOnce(null);

      const res = await makeAuthenticatedRequest(
        "get",
        "/questionnaire/response",
        {},
        8888
      );

      expect(res.statusCode).toEqual(204);
      expect(res.body).toEqual({});
    });
  });

  // Tests the questionnaire progress PUT endpoint
  describe("PUT /questionnaire/progress", () => {
    it("should update the questionnaire progress", async () => {
      const updatedProgress: MockQuestionnaireAttributes = {
        userId: mockUser.userId,
        responses: { 1: 2 },
        currentQuestion: 2,
      };

      const mockExistingProgress: MockQuestionnaireModel = {
        userId: mockUser.userId,
        responses: { 1: 2 },
        currentQuestion: 1,
        update: jest.fn().mockResolvedValue(updatedProgress),
      } as unknown as MockQuestionnaireModel;

      jest
        .spyOn(QuestionnaireResponse, "findOne")
        .mockResolvedValue(mockExistingProgress);

      const progressData = {
        responses: { 1: 2 },
        currentQuestion: 2,
      };

      const res = await makeAuthenticatedRequest(
        "put",
        "/questionnaire/progress",
        progressData
      );

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

      const res = await makeUnauthenticatedRequest(
        "put",
        "/questionnaire/progress",
        progressData
      );

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty(
        "error",
        "Unauthorized: No token provided"
      );
    });

    it("should return 400 when required fields are missing", async () => {
      const progressData = {
        // Missing currentQuestion
        responses: { 1: 2 },
      };

      const res = await makeAuthenticatedRequest(
        "put",
        "/questionnaire/progress",
        progressData
      );

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("error", "Missing required fields");
    });

    it("should create a new record if none exists", async () => {
      jest.spyOn(QuestionnaireResponse, "findOne").mockResolvedValueOnce(null);

      const mockNewProgress: MockQuestionnaireModel = {
        userId: 7777,
        responses: { 1: 2 },
        currentQuestion: 2,
      } as unknown as MockQuestionnaireModel;

      jest
        .spyOn(QuestionnaireResponse, "create")
        .mockResolvedValueOnce(mockNewProgress);

      const progressData = {
        responses: { 1: 2 },
        currentQuestion: 2,
      };

      const res = await makeAuthenticatedRequest(
        "put",
        "/questionnaire/progress",
        progressData,
        7777
      );

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty(
        "message",
        "Questionnaire progress saved"
      );
    });
  });

  // Tests the questionnaire progress GET endpoint
  describe("GET /questionnaire/progress", () => {
    it("should retrieve the questionnaire progress for the user", async () => {
      const mockProgress: MockQuestionnaireModel = {
        userId: mockUser.userId,
        responses: { 1: 2 },
        currentQuestion: 2,
      } as unknown as MockQuestionnaireModel;

      jest
        .spyOn(QuestionnaireResponse, "findOne")
        .mockResolvedValue(mockProgress);

      const res = await makeAuthenticatedRequest(
        "get",
        "/questionnaire/progress"
      );

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("responses");
      expect(res.body).toHaveProperty("currentQuestion");
    });

    it("should return 401 when no token is provided", async () => {
      const res = await makeUnauthenticatedRequest(
        "get",
        "/questionnaire/progress"
      );

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty(
        "error",
        "Unauthorized: No token provided"
      );
    });

    it("should return 404 when no progress is found for the user", async () => {
      jest.spyOn(QuestionnaireResponse, "findOne").mockResolvedValueOnce(null);

      const res = await makeAuthenticatedRequest(
        "get",
        "/questionnaire/progress",
        {},
        6666
      );

      expect(res.statusCode).toEqual(204);
      expect(res.body).toEqual({});
    });
  });

  // Tests the guest questionnaire POST endpoint
  describe("POST /questionnaire/guest", () => {
    it("should save guest questionnaire responses", async () => {
      const mockGuestResponse: MockQuestionnaireModel = {
        userId: mockGuestUser.userId,
        responses: { 1: 2, 2: [1, 3] },
        totalScore: 75,
      } as unknown as MockQuestionnaireModel;

      jest
        .spyOn(QuestionnaireResponse, "create")
        .mockResolvedValueOnce(mockGuestResponse);

      const responseData = {
        responses: { 1: 2, 2: [1, 3] },
        totalScore: 75,
      };

      const res = await makeGuestRequest(
        "post",
        "/questionnaire/guest",
        responseData
      );

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Guest responses saved");
    });

    it("should return 401 for non-guest users", async () => {
      const responseData = {
        responses: { 1: 2, 2: [1, 3] },
        totalScore: 75,
      };

      const res = await makeAuthenticatedRequest(
        "post",
        "/questionnaire/guest",
        responseData,
        mockUser.userId,
        "user"
      );

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });

    it("should return 401 when no token is provided", async () => {
      const responseData = {
        responses: { 1: 2, 2: [1, 3] },
        totalScore: 75,
      };

      const res = await makeUnauthenticatedRequest(
        "post",
        "/questionnaire/guest",
        responseData
      );

      expect(res.statusCode).toEqual(401);
    });
  });
});
