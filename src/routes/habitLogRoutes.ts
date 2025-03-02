import express from "express";
import {
  getHabitLogs,
  getAllHabitLogs,
  logHabit,
  deleteHabitLog,
  deleteAllHabitLogs,
} from "../controllers/habitLogController";
import { verifyToken } from "../middlewares/authMiddleware";

const router = express.Router();

// Apply authentication middleware to all habit log routes
router.use(verifyToken);

// Habit log routes
router.get("/all", getAllHabitLogs); // Get logs for all habits
router.get("/:habitId", getHabitLogs); // Get logs for a specific habit
router.post("/:habitId", logHabit); // Log a habit
router.delete("/log/:logId", deleteHabitLog); // Delete a specific log
router.delete("/:habitId", deleteAllHabitLogs); // Delete all logs for a specific habit

export default router;
