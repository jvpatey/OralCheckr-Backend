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
router.use(verifyToken);

/* -- Habit routes -- */
router.get("/", getHabits); // Get all habits
router.post("/", createHabit); // Create a new habit
router.put("/:id", updateHabit); // Update a habit by id
router.delete("/:id", deleteHabit); // Delete a habit by id
router.delete("/", deleteAllHabits); // Delete all habits

export default router;
