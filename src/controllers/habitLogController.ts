import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import HabitLog from "../models/habitLogModel";
import Habit from "../models/habitModel";
import { Op } from "sequelize";

// Get logs for a specific habit
export const getHabitLogs = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const habitId = parseInt(req.params.habitId);

    if (!userId || userId === "guest") {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    // Verify the habit belongs to the user
    const habit = await Habit.findOne({
      where: { habitId, userId },
    });

    if (!habit) {
      res.status(404).json({ error: "Habit not found" });
      return;
    }

    // Get date range from query params (optional)
    const { startDate, endDate } = req.query;
    const dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter.date = {
        [Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      dateFilter.date = {
        [Op.gte]: startDate,
      };
    } else if (endDate) {
      dateFilter.date = {
        [Op.lte]: endDate,
      };
    }

    const logs = await HabitLog.findAll({
      where: {
        habitId,
        userId,
        ...dateFilter,
      },
      order: [["date", "DESC"]],
    });

    res.status(200).json(logs);
  } catch (error) {
    console.error("Error fetching habit logs:", error);
    res.status(500).json({ error: "Failed to fetch habit logs" });
  }
};

// Get logs for all habits
export const getAllHabitLogs = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId || userId === "guest") {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    // Get date range from query params (optional)
    const { startDate, endDate } = req.query;
    const dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter.date = {
        [Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      dateFilter.date = {
        [Op.gte]: startDate,
      };
    } else if (endDate) {
      dateFilter.date = {
        [Op.lte]: endDate,
      };
    }

    const logs = await HabitLog.findAll({
      where: {
        userId,
        ...dateFilter,
      },
      include: [
        {
          model: Habit,
          as: "habit",
          attributes: ["habitId", "name", "count"],
        },
      ],
      order: [["date", "DESC"]],
    });

    res.status(200).json(logs);
  } catch (error) {
    console.error("Error fetching all habit logs:", error);
    res.status(500).json({ error: "Failed to fetch habit logs" });
  }
};

// Log a habit (create or update)
export const logHabit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const habitId = parseInt(req.params.habitId);
    const { date, count } = req.body;

    if (!userId || userId === "guest") {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    if (!date || count === undefined || count < 0) {
      res.status(400).json({
        error:
          "Date and count are required. Count must be a non-negative number.",
      });
      return;
    }

    // Verify the habit belongs to the user and get its max count
    const habit = await Habit.findOne({
      where: { habitId, userId },
    });

    if (!habit) {
      res.status(404).json({ error: "Habit not found" });
      return;
    }

    // Ensure count doesn't exceed the habit's max count
    if (count > habit.count) {
      res.status(400).json({
        error: `Count cannot exceed the habit's maximum count of ${habit.count}`,
      });
      return;
    }

    // Check if a log already exists for this habit and date
    const existingLog = await HabitLog.findOne({
      where: { habitId, userId, date },
    });

    let log;

    if (existingLog) {
      // Update existing log
      log = await existingLog.update({ count });
    } else {
      // Create new log
      log = await HabitLog.create({
        habitId,
        userId,
        date,
        count,
      });
    }

    res.status(200).json(log);
  } catch (error) {
    console.error("Error logging habit:", error);
    res.status(500).json({ error: "Failed to log habit" });
  }
};

// Delete a habit log
export const deleteHabitLog = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const logId = parseInt(req.params.logId);

    if (!userId || userId === "guest") {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    const log = await HabitLog.findOne({
      where: { logId, userId },
    });

    if (!log) {
      res.status(404).json({ error: "Habit log not found" });
      return;
    }

    await log.destroy();

    res.status(200).json({ message: "Habit log deleted successfully" });
  } catch (error) {
    console.error("Error deleting habit log:", error);
    res.status(500).json({ error: "Failed to delete habit log" });
  }
};

// Delete all logs for a specific habit
export const deleteAllHabitLogs = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const habitId = parseInt(req.params.habitId);

    if (!userId || userId === "guest") {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    // Verify the habit belongs to the user
    const habit = await Habit.findOne({
      where: { habitId, userId },
    });

    if (!habit) {
      res.status(404).json({ error: "Habit not found" });
      return;
    }

    await HabitLog.destroy({
      where: { habitId, userId },
    });

    res.status(200).json({ message: "All habit logs deleted successfully" });
  } catch (error) {
    console.error("Error deleting all habit logs:", error);
    res.status(500).json({ error: "Failed to delete all habit logs" });
  }
};
