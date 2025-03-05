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

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    // Get date range from query params (optional)
    const { year, month } = req.query;
    const dateFilter: any = {};

    if (year && month) {
      // Convert month name to month number (0-11)
      const startDate = new Date(
        parseInt(year as string),
        new Date(month as string).getMonth(),
        1
      );
      const endDate = new Date(
        parseInt(year as string),
        new Date(month as string).getMonth() + 1,
        0
      );

      dateFilter.date = {
        [Op.between]: [startDate, endDate],
      };
    }

    const logs = await HabitLog.findAll({
      where: {
        habitId,
        userId,
        ...dateFilter,
      },
      include: [
        {
          model: Habit,
          as: "habit",
          attributes: ["name", "count"],
          where: { userId }, // Ensures the habit belongs to the user
        },
      ],
      order: [["date", "DESC"]],
    });

    // Transform logs to match frontend format
    const transformedLogs = logs.reduce((acc: any, log) => {
      const date = new Date(log.date);
      const year = date.getFullYear();
      const month = date.toLocaleString("default", { month: "long" });
      const day = date.getDate();

      acc[year] = acc[year] || {};
      acc[year][month] = acc[year][month] || {};
      acc[year][month][day] = log.count;

      return acc;
    }, {});

    res.status(200).json(transformedLogs);
  } catch (error) {
    console.error("Error fetching habit logs:", error);
    res.status(500).json({ error: "Failed to fetch habit logs" });
  }
};

// Log a habit (increment by 1)
export const logHabit = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const habitId = parseInt(req.params.habitId);
    const { year, month, day } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    if (!habitId || isNaN(habitId)) {
      res.status(400).json({ error: "Invalid habit ID" });
      return;
    }

    if (!year || !month || !day) {
      res.status(400).json({
        error: "Year, month, and day are required",
        received: { year, month, day },
      });
      return;
    }

    // Convert month name to month index (0-11)
    const monthIndex = new Date(Date.parse(`${month} 1, 2000`)).getMonth();
    if (isNaN(monthIndex)) {
      res.status(400).json({
        error: "Invalid month name provided",
        received: { month },
        validMonths: [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ],
      });
      return;
    }

    // Create date using the month index
    const date = new Date(year, monthIndex, day);

    if (isNaN(date.getTime())) {
      res.status(400).json({
        error: "Invalid date values provided",
        received: { year, month, day },
        parsedDate: date,
      });
      return;
    }

    // Validate the date is not in the future
    const today = new Date();
    if (date > today) {
      res.status(400).json({
        error: "Cannot log habits for future dates",
        received: { year, month, day },
        currentDate: today.toISOString().split("T")[0],
      });
      return;
    }

    // Find the habit and verify ownership
    const habit = await Habit.findOne({
      where: { habitId, userId },
      attributes: ["count", "name"],
    });

    if (!habit) {
      res.status(404).json({
        error: "Habit not found or unauthorized",
        habitId,
        userId,
      });
      return;
    }

    // Get current log count for this date
    const existingLog = await HabitLog.findOne({
      where: { habitId, userId, date },
    });

    const currentCount = existingLog?.count || 0;

    // Check if incrementing would exceed max count
    if (currentCount >= habit.count) {
      res.status(400).json({
        error: `Cannot increment: would exceed habit's maximum count of ${habit.count}`,
        currentCount,
        maxCount: habit.count,
      });
      return;
    }

    // Upsert the log with incremented count
    const [log] = await HabitLog.upsert({
      habitId,
      userId,
      date,
      count: currentCount + 1,
    });

    // Return in frontend format
    res.status(200).json({
      [year]: {
        [month]: {
          [day]: currentCount + 1,
        },
      },
    });
  } catch (error) {
    console.error("Error logging habit:", error);
    res.status(500).json({
      error: "Failed to log habit",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete a habit log (decrement by 1)
export const deleteHabitLog = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const habitId = parseInt(req.params.habitId);
    const { year, month, day } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    if (!year || !month || !day) {
      res.status(400).json({
        error: "Year, month, and day are required",
        received: { year, month, day },
      });
      return;
    }

    // Convert month name to month index (0-11)
    const monthIndex = new Date(Date.parse(`${month} 1, 2000`)).getMonth();
    if (isNaN(monthIndex)) {
      res.status(400).json({
        error: "Invalid month name provided",
        received: { month },
        validMonths: [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ],
      });
      return;
    }

    // Create date using the month index
    const date = new Date(year, monthIndex, day);

    if (isNaN(date.getTime())) {
      res.status(400).json({
        error: "Invalid date values provided",
        received: { year, month, day },
        parsedDate: date,
      });
      return;
    }

    // Find the log for this date
    const log = await HabitLog.findOne({
      where: { habitId, userId, date },
    });

    if (!log) {
      res.status(404).json({ error: "Habit log not found or unauthorized" });
      return;
    }

    if (log.count <= 1) {
      // If count is 1, delete the log entirely
      await log.destroy();
    } else {
      // Otherwise decrement the count
      log.count -= 1;
      await log.save();
    }

    // Return in frontend format
    res.status(200).json({
      [year]: {
        [month]: {
          [day]: log.count > 1 ? log.count - 1 : 0,
        },
      },
    });
  } catch (error) {
    console.error("Error updating habit log:", error);
    res.status(500).json({
      error: "Failed to update habit log",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
