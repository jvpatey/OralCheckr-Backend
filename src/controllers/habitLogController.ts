import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import HabitLog from "../models/habitLogModel";
import Habit from "../models/habitModel";
import { Op } from "sequelize";
import {
  parse,
  isValid,
  isFuture,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

// Use UTC timezone for consistent date handling
const TIMEZONE = "UTC";

/* -- Get logs for a specific habit -- */
export const getHabitLogs = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const habitId = parseInt(req.params.habitId);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      console.log("Habit logs fetch failed: User not authenticated");
      return;
    }

    // Get date range from query params
    const { year, month } = req.query;
    const dateFilter: any = {};

    if (year && month) {
      try {
        // Parse the date string to get a date object for the first day of the month
        const localMonthDate = parse(
          `${month} 1, ${year}`,
          "MMMM d, yyyy",
          new Date()
        );

        if (!isValid(localMonthDate)) {
          res.status(400).json({
            error: "Invalid date format",
            received: { year, month },
          });
          console.log("Habit logs fetch failed: Invalid date format");
          return;
        }

        // Convert to UTC to ensure consistent timezone handling
        const monthDate = toZonedTime(localMonthDate, TIMEZONE);

        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        dateFilter.date = {
          [Op.between]: [startDate, endDate],
        };
      } catch (error) {
        res.status(400).json({
          error: "Invalid date format",
          received: { year, month },
          details: error instanceof Error ? error.message : "Unknown error",
        });
        console.log("Habit logs fetch failed: Date parsing error");
        return;
      }
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

    console.log(
      `Habit logs fetched successfully for user: ${userId}, habit: ${habitId}. Total logs: ${logs.length}`
    );

    // Transform logs to flat structure only
    const transformedLogs = logs.map((log) => {
      // Convert the date to a proper UTC date string
      // This ensures consistent date handling regardless of local timezone
      const isoDate = formatInTimeZone(
        new Date(log.date),
        TIMEZONE,
        "yyyy-MM-dd"
      );

      // In tests, log is often a plain object, so we need to handle both cases
      const habitName =
        typeof log.get === "function"
          ? (log.get("habit") as any)?.name
          : (log as any).habit?.name;

      return {
        id: log.logId,
        date: isoDate,
        count: log.count,
        habitId: log.habitId,
        habitName: habitName || null,
      };
    });

    res.status(200).json({ logs: transformedLogs });
  } catch (error) {
    console.error("Error fetching habit logs:", error);
    res.status(500).json({ error: "Failed to fetch habit logs" });
  }
};

/* -- Log a habit (increment by 1) -- */
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
      console.log("Habit log creation failed: User not authenticated");
      return;
    }

    if (!habitId || isNaN(habitId)) {
      res.status(400).json({ error: "Invalid habit ID" });
      console.log("Habit log creation failed: Invalid habit ID");
      return;
    }

    if (!year || !month || !day) {
      res.status(400).json({
        error: "Year, month, and day are required",
        received: { year, month, day },
      });
      console.log("Habit log creation failed: Missing required date fields");
      return;
    }

    let parsedDate;
    try {
      // Parse the date using date-fns
      const localDate = parse(
        `${month} ${day}, ${year}`,
        "MMMM d, yyyy",
        new Date()
      );

      if (!isValid(localDate)) {
        res.status(400).json({
          error: "Invalid date values provided",
          received: { year, month, day },
        });
        console.log("Habit log creation failed: Invalid date values");
        return;
      }

      // Convert to UTC to ensure consistent timezone handling
      parsedDate = toZonedTime(localDate, TIMEZONE);

      // Validate the date is not in the future
      if (isFuture(parsedDate)) {
        res.status(400).json({
          error: "Cannot log habits for future dates",
          received: { year, month, day },
          currentDate: formatInTimeZone(new Date(), TIMEZONE, "yyyy-MM-dd"),
        });
        console.log("Habit log creation failed: Future date provided");
        return;
      }
    } catch (error) {
      res.status(400).json({
        error: "Invalid date format",
        received: { year, month, day },
        details: error instanceof Error ? error.message : "Unknown error",
      });
      console.log("Habit log creation failed: Date parsing error");
      return;
    }

    try {
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
        console.log(
          "Habit log creation failed: Habit not found or unauthorized"
        );
        return;
      }

      // Get current log count for this date
      const existingLog = await HabitLog.findOne({
        where: { habitId, userId, date: parsedDate },
      });

      const currentCount = existingLog?.count || 0;

      // Check if incrementing would exceed max count
      if (currentCount >= habit.count) {
        res.status(400).json({
          error: `Cannot increment: would exceed habit's maximum count of ${habit.count}`,
          currentCount,
          maxCount: habit.count,
        });
        console.log(
          `Habit log creation failed: Would exceed max count of ${habit.count}`
        );
        return;
      }

      // Upsert the log with incremented count
      const [log] = await HabitLog.upsert({
        habitId,
        userId,
        date: parsedDate,
        count: currentCount + 1,
      });

      console.log(
        `Habit log incremented successfully for user: ${userId}, habit: ${
          habit.name
        }, count increased from ${currentCount} to ${currentCount + 1}`
      );

      // Return only flat format with consistent timezone handling
      const isoDate = formatInTimeZone(parsedDate, TIMEZONE, "yyyy-MM-dd");

      res.status(200).json({
        log: {
          id: log.logId,
          date: isoDate,
          count: currentCount + 1,
          habitId,
          habitName: habit.name,
        },
      });
    } catch (error) {
      console.error("Error logging habit:", error);
      res.status(500).json({
        error: "Failed to log habit",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } catch (error) {
    console.error("Error logging habit:", error);
    res.status(500).json({
      error: "Failed to log habit",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/* -- Delete a habit log (decrement by 1) -- */
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
      console.log("Habit log deletion failed: User not authenticated");
      return;
    }

    if (!year || !month || !day) {
      res.status(400).json({
        error: "Year, month, and day are required",
        received: { year, month, day },
      });
      console.log("Habit log deletion failed: Missing required date fields");
      return;
    }

    let parsedDate;
    try {
      // Parse the date using date-fns
      parsedDate = parse(
        `${month} ${day}, ${year}`,
        "MMMM d, yyyy",
        new Date()
      );

      if (!isValid(parsedDate)) {
        res.status(400).json({
          error: "Invalid date values provided",
          received: { year, month, day },
        });
        console.log("Habit log deletion failed: Invalid date values");
        return;
      }
    } catch (error) {
      res.status(400).json({
        error: "Invalid date format",
        received: { year, month, day },
        details: error instanceof Error ? error.message : "Unknown error",
      });
      console.log("Habit log deletion failed: Date parsing error");
      return;
    }

    try {
      // Find the log for this date
      const log = await HabitLog.findOne({
        where: { habitId, userId, date: parsedDate },
      });

      if (!log) {
        res.status(404).json({ error: "Habit log not found or unauthorized" });
        console.log("Habit log deletion failed: Log not found or unauthorized");
        return;
      }

      let updatedCount = 0;
      let logDeleted = false;

      if (log.count <= 1) {
        // If count is 1, delete the log entirely
        await log.destroy();
        logDeleted = true;
        console.log(
          `Habit log deleted successfully for user: ${userId}, habit: ${habitId}`
        );
      } else {
        // Otherwise decrement the count
        log.count -= 1;
        await log.save();
        updatedCount = log.count;
        console.log(
          `Habit log count decremented for user: ${userId}, habit: ${habitId}, new count: ${updatedCount}`
        );
      }

      // Return only flat format
      const isoDate = format(parsedDate, "yyyy-MM-dd");

      res.status(200).json({
        log: logDeleted
          ? null
          : {
              id: log.logId,
              date: isoDate,
              count: updatedCount,
              habitId,
            },
        deleted: logDeleted,
      });
    } catch (error) {
      console.error("Error updating habit log:", error);
      res.status(500).json({
        error: "Failed to update habit log",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } catch (error) {
    console.error("Error updating habit log:", error);
    res.status(500).json({
      error: "Failed to update habit log",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
