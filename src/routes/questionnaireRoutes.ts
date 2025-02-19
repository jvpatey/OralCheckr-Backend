import { Router } from "express";
import {
  saveResponse,
  getResponseByUser,
  updateProgress,
  getProgress,
} from "../controllers/questionnaireControllers";

const router = Router();

// Save questionnaire response
router.post("/response", saveResponse);

// Get questionnaire responses (userID is extracted from jwt token)
router.get("/response", getResponseByUser);

// Update the questionnaire progress (partial responses, current question)
router.put("/progress", updateProgress);

// Retrieve the questionnaire progress
router.get("/progress", getProgress);

export default router;
