import { Router } from "express";
import {
  saveResponse,
  getResponseByUser,
  updateProgress,
  getProgress,
  saveGuestQuestionnaireResponse,
} from "../controllers/questionnaireControllers";
import { verifyToken } from "../middlewares/authMiddleware";

const router = Router();

// Save questionnaire response
router.post("/response", saveResponse);

// Get questionnaire responses (userID is extracted from jwt token)
router.get("/response", getResponseByUser);

// Update the questionnaire progress (partial responses, current question)
router.put("/progress", updateProgress);

// Retrieve the questionnaire progress
router.get("/progress", getProgress);

// Save guest questionnaire responses
router.post("/guest", verifyToken, saveGuestQuestionnaireResponse);

export default router;
