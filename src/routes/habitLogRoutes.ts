import express from "express";
import {
  getHabitLogs,
  logHabit,
  deleteHabitLog,
} from "../controllers/habitLogController";
import { verifyToken } from "../middlewares/authMiddleware";

const router = express.Router();

// Authentication middleware
router.use(verifyToken);

// Habit log routes
router.get("/:habitId", getHabitLogs); // Get habit logs
router.post("/:habitId/increment", logHabit); // Increment habit count for a specific date
router.post("/:habitId/decrement", deleteHabitLog); // Decrement habit count for a specific date

export default router;
