import { Response } from "express";
import Habit from "../models/habitModel";
import HabitLog from "../models/habitLogModel";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import {
  HabitCreationAttributes,
  HabitResponse,
  HabitError,
  HabitUpdateData,
} from "../interfaces/habit";

/* -- Get all habits for a user -- */
export const getHabits = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      console.log("Habits fetch failed: User not authenticated");
      return;
    }

    const habits = await Habit.findAll({
      where: { userId },
      order: [["createdAt", "ASC"]],
    });

    console.log(
      `Habits fetched successfully for user: ${userId}. Total habits: ${habits.length}`
    );
    res.status(200).json(habits);
  } catch (error) {
    console.error("Error fetching habits:", error);
    if (error instanceof Error) {
      res
        .status(400)
        .json({ error: `Failed to fetch habits: ${error.message}` });
    } else {
      res.status(500).json({
        error:
          "Failed to fetch habits due to an unexpected error. Please try again.",
      });
    }
  }
};

/* -- Create a new habit -- */
export const createHabit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      console.log("Habit creation failed: User not authenticated");
      return;
    }

    const { name, count } = req.body;

    if (!name || count === undefined || count < 1) {
      res.status(400).json({
        error: "Name and count are required. Count must be a positive number.",
      });
      console.log("Habit creation failed: Missing required fields");
      return;
    }

    // Check if habit with same name already exists for this user
    const existingHabit = await Habit.findOne({
      where: { name, userId },
    });

    if (existingHabit) {
      res.status(400).json({ error: "A habit with this name already exists" });
      console.log("Habit creation failed: Habit with same name already exists");
      return;
    }

    const habitData: HabitCreationAttributes = {
      name,
      count,
      userId,
    };

    const habit = await Habit.create(habitData);
    console.log(
      `User: ${userId} created habit successfully: Name: ${habit.name}, Count: ${habit.count}`
    );

    res.status(201).json(habit);
  } catch (error) {
    console.error("Error creating habit:", error);
    if (error instanceof Error) {
      const habitError = error as HabitError;
      if (habitError.errors && Array.isArray(habitError.errors)) {
        const validationErrors = habitError.errors
          .map((err) => err.message)
          .join(", ");
        res
          .status(400)
          .json({ error: `Failed to create habit: ${validationErrors}` });
      } else {
        res
          .status(400)
          .json({ error: `Failed to create habit: ${error.message}` });
      }
    } else {
      res.status(500).json({
        error:
          "Failed to create habit due to an unexpected error. Please try again.",
      });
    }
  }
};

/* -- Update a habit -- */
export const updateHabit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const habitId = parseInt(req.params.id);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      console.log("Habit update failed: User not authenticated");
      return;
    }

    const updateData: HabitUpdateData = req.body;

    if (
      !updateData.name ||
      updateData.count === undefined ||
      updateData.count < 1
    ) {
      res.status(400).json({
        error: "Name and count are required. Count must be a positive number.",
      });
      console.log("Habit update failed: Missing required fields");
      return;
    }

    // Find the habit
    const habit = await Habit.findOne({
      where: { habitId, userId },
    });

    if (!habit) {
      res.status(404).json({ error: "Habit not found" });
      console.log("Habit update failed: Habit not found");
      return;
    }

    // Check if another habit with the new name already exists
    if (updateData.name !== habit.name) {
      const existingHabit = await Habit.findOne({
        where: { name: updateData.name, userId },
      });

      if (existingHabit) {
        res
          .status(400)
          .json({ error: "A habit with this name already exists" });
        console.log("Habit update failed: Habit with same name already exists");
        return;
      }
    }

    // Update the habit
    await habit.update(updateData);

    const updatedHabit: HabitResponse = {
      ...habit.toJSON(),
      message: "Habit updated successfully",
    };

    res.status(200).json(updatedHabit);
    console.log(
      `User: ${userId} updated habit successfully: Name: ${habit.name}, Count: ${habit.count}`
    );
  } catch (error) {
    console.error("Error updating habit:", error);
    res.status(500).json({ error: "Failed to update habit" });
  }
};

/* -- Delete a habit -- */
export const deleteHabit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const habitId = parseInt(req.params.id);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      console.log("Habit deletion failed: User not authenticated");
      return;
    }

    // Find the habit
    const habit = await Habit.findOne({
      where: { habitId, userId },
    });

    if (!habit) {
      res.status(404).json({ error: "Habit not found" });
      console.log("Habit deletion failed: Habit not found");
      return;
    }

    // Delete associated logs first
    await HabitLog.destroy({
      where: { habitId, userId },
    });

    // Then delete the habit
    await habit.destroy();

    const response: HabitResponse = {
      habitId: habit.habitId,
      userId: habit.userId,
      name: habit.name,
      count: habit.count,
      message: "Habit and associated logs deleted successfully",
    };

    res.status(200).json(response);
    console.log(
      `User: ${userId} deleted habit successfully: Name: ${habit.name}`
    );
  } catch (error) {
    console.error("Error deleting habit:", error);
    res.status(500).json({ error: "Failed to delete habit" });
  }
};

/* -- Delete all habits for a user -- */
export const deleteAllHabits = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      console.log("Habit deletion failed: User not authenticated");
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

    const response: HabitResponse = {
      habitId: 0, // Placeholder since deleting all habits
      userId: userId,
      name: "", // Placeholder since deleting all habits
      count: 0, // Placeholder since deleting all habits
      message: "All habits and their logs deleted successfully",
    };

    res.status(200).json(response);
    console.log(`User: ${userId} deleted all habits successfully`);
  } catch (error) {
    console.error("Error deleting all habits:", error);
    res.status(500).json({ error: "Failed to delete all habits" });
  }
};
