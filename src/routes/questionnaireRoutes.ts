import { Router } from "express";
import {
  saveResponse,
  getResponseByUser,
} from "../controllers/questionnaireControllers";

const router = Router();

// Save questionnaire response
router.post("/response", saveResponse);

// Get questionnaire response by userId
router.get("/response/:userId", getResponseByUser);

export default router;
