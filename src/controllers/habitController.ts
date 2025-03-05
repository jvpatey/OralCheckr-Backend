import { Response } from "express";
import Habit from "../models/habitModel";
import HabitLog from "../models/habitLogModel";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

// Get all habits for a user
export const getHabits = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    const habits = await Habit.findAll({
      where: { userId },
      order: [["createdAt", "ASC"]],
    });

    res.status(200).json(habits);
  } catch (error) {
    console.error("Error fetching habits:", error);
    res.status(500).json({ error: "Failed to fetch habits" });
  }
};

// Create a new habit
export const createHabit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    const { name, count } = req.body;

    if (!name || count === undefined || count < 1) {
      res.status(400).json({
        error: "Name and count are required. Count must be a positive number.",
      });
      return;
    }

    // Check if habit with same name already exists for this user
    const existingHabit = await Habit.findOne({
      where: { name, userId },
    });

    if (existingHabit) {
      res.status(400).json({ error: "A habit with this name already exists" });
      return;
    }

    const habit = await Habit.create({
      name,
      count,
      userId,
    });

    res.status(201).json(habit);
  } catch (error) {
    console.error("Error creating habit:", error);
    res.status(500).json({ error: "Failed to create habit" });
  }
};

// Update a habit
export const updateHabit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const habitId = parseInt(req.params.id);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    const { name, count } = req.body;

    if (!name || count === undefined || count < 1) {
      res.status(400).json({
        error: "Name and count are required. Count must be a positive number.",
      });
      return;
    }

    // Find the habit
    const habit = await Habit.findOne({
      where: { habitId, userId },
    });

    if (!habit) {
      res.status(404).json({ error: "Habit not found" });
      return;
    }

    // Check if another habit with the new name already exists
    if (name !== habit.name) {
      const existingHabit = await Habit.findOne({
        where: { name, userId },
      });

      if (existingHabit) {
        res
          .status(400)
          .json({ error: "A habit with this name already exists" });
        return;
      }
    }

    // Update the habit
    await habit.update({ name, count });

    res.status(200).json(habit);
  } catch (error) {
    console.error("Error updating habit:", error);
    res.status(500).json({ error: "Failed to update habit" });
  }
};

// Delete a habit
export const deleteHabit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const habitId = parseInt(req.params.id);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    const habit = await Habit.findOne({
      where: { habitId, userId },
    });

    if (!habit) {
      res.status(404).json({ error: "Habit not found" });
      return;
    }

    // Delete associated logs first
    await HabitLog.destroy({
      where: { habitId, userId },
    });

    // Then delete the habit
    await habit.destroy();

    res
      .status(200)
      .json({ message: "Habit and associated logs deleted successfully" });
  } catch (error) {
    console.error("Error deleting habit:", error);
    res.status(500).json({ error: "Failed to delete habit" });
  }
};

// Delete all habits for a user
export const deleteAllHabits = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    // Delete all logs for this user first
    await HabitLog.destroy({
      where: { userId },
    });

    // Then delete all habits
    await Habit.destroy({
      where: { userId },
    });

    res
      .status(200)
      .json({ message: "All habits and their logs deleted successfully" });
  } catch (error) {
    console.error("Error deleting all habits:", error);
    res.status(500).json({ error: "Failed to delete all habits" });
  }
};
