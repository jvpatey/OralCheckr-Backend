import { Router } from "express";
import {
  saveResponse,
  getResponseByUser,
} from "../controllers/questionnaireControllers";

const router = Router();

// Save questionnaire response
router.post("/response", saveResponse);

// Get questionnaire responses (userID is extracted from jwt token)
router.get("/response", getResponseByUser);

export default router;
