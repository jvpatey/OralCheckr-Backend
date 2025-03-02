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

// Apply authentication middleware to all habit routes
router.use(verifyToken);

// Habit routes
router.get("/", getHabits);
router.post("/", createHabit);
router.put("/:id", updateHabit);
router.delete("/:id", deleteHabit);
router.delete("/", deleteAllHabits);

export default router;
