import express from "express";
import {
  getHabitLogs,
  logHabit,
  deleteHabitLog,
} from "../controllers/habitLogController";
import { verifyToken } from "../middlewares/authMiddleware";

const router = express.Router();

/* -- Habit log routes -- */
router.get("/:habitId", verifyToken, getHabitLogs); // Get habit logs
router.post("/:habitId/increment", verifyToken, logHabit); // Increment habit count for a specific date
router.post("/:habitId/decrement", verifyToken, deleteHabitLog); // Decrement habit count for a specific date

export default router;
