import { Router } from "express";
import {
  saveResponse,
  getResponseByUser,
  updateProgress,
  getProgress,
  saveGuestQuestionnaireResponse,
  deleteQuestionnaireData,
} from "../controllers/questionnaireControllers";
import { verifyToken } from "../middlewares/authMiddleware";

const router = Router();

/* -- Questionnaire Routes -- */
router.post("/response", verifyToken, saveResponse); // Save questionnaire response
router.get("/response", verifyToken, getResponseByUser); // Get questionnaire responses
router.put("/progress", verifyToken, updateProgress); // Update the questionnaire progress
router.get("/progress", verifyToken, getProgress); // Retrieve the questionnaire progress
router.post("/guest", verifyToken, saveGuestQuestionnaireResponse); // Save guest questionnaire responses
router.delete("/response", verifyToken, deleteQuestionnaireData); // Delete questionnaire data

export default router;
