import express from "express";
import {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  deleteAllHabits,
} from "../controllers/habitController";
import { verifyToken } from "../middlewares/authMiddleware";

const router = express.Router();

/* -- Habit routes -- */
router.get("/", verifyToken, getHabits); // Get all habits
router.post("/", verifyToken, createHabit); // Create a new habit
router.put("/:id", verifyToken, updateHabit); // Update a habit by id
router.delete("/:id", verifyToken, deleteHabit); // Delete a habit by id
router.delete("/", verifyToken, deleteAllHabits); // Delete all habits

export default router;
