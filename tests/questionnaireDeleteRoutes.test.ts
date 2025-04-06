import QuestionnaireResponse from "../src/models/questionnaireResponseModel";
import sequelize from "../src/db/db";
import {
  mockUser,
  mockGuestUser,
  mockQuestionnaireData,
  makeAuthenticatedRequest,
  makeUnauthenticatedRequest,
  makeGuestRequest,
} from "./utils/testUtils";

/* -- Questionnaire Delete Routes Tests -- */
// JWT secret for test tokens
process.env.JWT_SECRET = "testsecret";

/* -- Initialize test suite for questionnaire delete routes -- */
describe("Questionnaire Profile Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // Tests the questionnaire response DELETE endpoint
  describe("DELETE /questionnaire/response", () => {
    it("should successfully delete questionnaire data", async () => {
      const mockDestroy = jest.fn().mockResolvedValue(undefined);
      jest.spyOn(QuestionnaireResponse, "findOne").mockResolvedValue({
        id: 1,
        userId: mockUser.userId,
        responses: {},
        totalScore: 75,
        destroy: mockDestroy,
      } as any);

      const res = await makeAuthenticatedRequest(
        "delete",
        "/questionnaire/response"
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(
        "message",
        "Questionnaire data deleted successfully"
      );
      expect(mockDestroy).toHaveBeenCalled();
    });

    it("should return 404 if no questionnaire data found", async () => {
      jest.spyOn(QuestionnaireResponse, "findOne").mockResolvedValue(null);

      const res = await makeAuthenticatedRequest(
        "delete",
        "/questionnaire/response"
      );

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty(
        "error",
        "No questionnaire data found for this user"
      );
    });

    it("should return 401 if not authenticated", async () => {
      const res = await makeUnauthenticatedRequest(
        "delete",
        "/questionnaire/response"
      );

      expect(res.status).toBe(401);
    });
  });

  // Tests the guest questionnaire POST endpoint
  describe("POST /questionnaire/guest", () => {
    it("should save questionnaire data for guest user", async () => {
      jest.spyOn(QuestionnaireResponse, "create").mockResolvedValue({
        id: 1,
        userId: mockGuestUser.userId,
        responses: mockQuestionnaireData.responses,
        totalScore: mockQuestionnaireData.totalScore,
      } as any);

      const res = await makeGuestRequest(
        "post",
        "/questionnaire/guest",
        mockQuestionnaireData
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Guest responses saved");
    });

    it("should return 401 if not a guest user", async () => {
      const res = await makeAuthenticatedRequest(
        "post",
        "/questionnaire/guest",
        mockQuestionnaireData
      );

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });

    it("should return 401 if not authenticated", async () => {
      const res = await makeUnauthenticatedRequest(
        "post",
        "/questionnaire/guest",
        mockQuestionnaireData
      );

      expect(res.status).toBe(401);
    });
  });
});
