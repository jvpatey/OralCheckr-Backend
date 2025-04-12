import { Response } from "express";
import { AuthenticatedRequest } from "../interfaces/auth";
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
import {
  HabitLogResponse,
  DateParams,
  LogDeleteResponse,
  HabitLogWithHabit,
} from "../interfaces/habitLog";

/* -- Habit Log Controller -- */

const TIMEZONE = "UTC";

/* -- Get logs for a specific habit -- */
export const getHabitLogs = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the user's ID and habit ID from the request
    const userId = req.user?.userId;
    const habitId = parseInt(req.params.habitId);

    // Check if the user is authenticated
    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      console.log("Habit logs fetch failed: User not authenticated");
      return;
    }

    // Get date range from query params
    const { year, month } = req.query;
    const dateFilter: { date?: { [Op.between]: [Date, Date] } } = {};

    // Check if the year and month are provided
    if (year && month) {
      try {
        const localMonthDate = parse(
          `${month} 1, ${year}`,
          "MMMM d, yyyy",
          new Date()
        );

        // Check if the date is valid
        if (!isValid(localMonthDate)) {
          res.status(400).json({
            error: "Invalid date format",
            received: { year, month },
          });
          console.log("Habit logs fetch failed: Invalid date format");
          return;
        }

        // Convert to UTC and get the start and end dates of the month
        const monthDate = toZonedTime(localMonthDate, TIMEZONE);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        // Set the date filter
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

    // Get the logs for the habit
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
          where: { userId },
        },
      ],
      order: [["date", "DESC"]],
    });

    console.log(
      `Habit logs fetched successfully for user: ${userId}, habit: ${habitId}. Total logs: ${logs.length}`
    );

    // Convert the logs to a flat structure
    const transformedLogs: HabitLogResponse[] = logs.map(
      (log: HabitLogWithHabit) => {
        // Convert the date to a UTC date string
        const isoDate = formatInTimeZone(
          new Date(log.date),
          TIMEZONE,
          "yyyy-MM-dd"
        );

        // Get the habit name
        const habitName = log.habit?.name || null;

        return {
          id: log.logId,
          date: isoDate,
          count: log.count,
          habitId: log.habitId,
          habitName,
        };
      }
    );

    // Send a success response to the client
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
    // Get the user's ID, habit ID, and date params
    const userId = req.user?.userId;
    const habitId = parseInt(req.params.habitId);
    const { year, month, day } = req.body as DateParams;

    // Check if the user is authenticated
    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      console.log("Habit log creation failed: User not authenticated");
      return;
    }

    // Check if the habit ID is valid
    if (!habitId || isNaN(habitId)) {
      res.status(400).json({ error: "Invalid habit ID" });
      console.log("Habit log creation failed: Invalid habit ID");
      return;
    }

    // Check if the year, month, and day are provided
    if (!year || !month || !day) {
      res.status(400).json({
        error: "Year, month, and day are required",
        received: { year, month, day },
      });
      console.log("Habit log creation failed: Missing required date fields");
      return;
    }

    // Parse the date using date-fns
    let parsedDate: Date;
    try {
      const localDate = parse(
        `${month} ${day}, ${year}`,
        "MMMM d, yyyy",
        new Date()
      );

      // Check if the date is valid
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

      // Ensure the date is not in the future
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
      // Get the habit
      const habit = await Habit.findOne({
        where: { habitId, userId },
        attributes: ["count", "name"],
      });

      // Check if the habit exists
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

      // Get the current count
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

      // Format the date
      const isoDate = formatInTimeZone(parsedDate, TIMEZONE, "yyyy-MM-dd");

      // Create the response object
      const response: HabitLogResponse = {
        id: log.logId,
        date: isoDate,
        count: currentCount + 1,
        habitId,
        habitName: habit.name,
      };

      // Send a success response to the client
      res.status(200).json({ log: response });
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
    // Get the user's ID, habit ID, and date params
    const userId = req.user?.userId;
    const habitId = parseInt(req.params.habitId);
    const { year, month, day } = req.body as DateParams;

    // Check if the user is authenticated
    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      console.log("Habit log deletion failed: User not authenticated");
      return;
    }

    // Check if the year, month, and day are provided
    if (!year || !month || !day) {
      res.status(400).json({
        error: "Year, month, and day are required",
        received: { year, month, day },
      });
      console.log("Habit log deletion failed: Missing required date fields");
      return;
    }

    // Parse the date using date-fns
    let parsedDate: Date;
    try {
      parsedDate = parse(
        `${month} ${day}, ${year}`,
        "MMMM d, yyyy",
        new Date()
      );

      // Check if the date is valid
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
      // Get the log
      const log = await HabitLog.findOne({
        where: { habitId, userId, date: parsedDate },
      });

      // Check if the log exists
      if (!log) {
        res.status(404).json({ error: "Habit log not found or unauthorized" });
        console.log("Habit log deletion failed: Log not found or unauthorized");
        return;
      }

      // Get the updated count
      let updatedCount = 0;
      // Check if the log was deleted
      let logDeleted = false;

      // Check if the count is 1 - if so, delete the log entirely
      if (log.count <= 1) {
        await log.destroy();
        logDeleted = true;
        console.log(
          `Habit log deleted successfully for user: ${userId}, habit: ${habitId}`
        );
      } else {
        // Decrement the count
        log.count -= 1;
        await log.save();
        updatedCount = log.count;
        console.log(
          `Habit log count decremented for user: ${userId}, habit: ${habitId}, new count: ${updatedCount}`
        );
      }

      // Format the date
      const isoDate = format(parsedDate, "yyyy-MM-dd");

      // Create the response object
      const response: LogDeleteResponse = {
        log: logDeleted
          ? null
          : {
              id: log.logId,
              date: isoDate,
              count: updatedCount,
              habitId,
              habitName: null,
            },
        deleted: logDeleted,
      };

      // Send a success response to the client
      res.status(200).json(response);
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
