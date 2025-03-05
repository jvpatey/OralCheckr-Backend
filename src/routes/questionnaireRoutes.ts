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

/* -- Questionnaire Routes -- */
router.post("/response", saveResponse); // Save questionnaire response
router.get("/response", getResponseByUser); // Get questionnaire responses
router.put("/progress", updateProgress); // Update the questionnaire progress
router.put("/progress", updateProgress);
router.get("/progress", getProgress); // Retrieve the questionnaire progress
router.post("/guest", verifyToken, saveGuestQuestionnaireResponse); // Save guest questionnaire responses

export default router;
