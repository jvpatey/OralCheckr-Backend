import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel";
import QuestionnaireResponse from "../models/questionnaireResponseModel";
import Habit from "../models/habitModel";
import HabitLog from "../models/habitLogModel";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import {
  createGuestUser,
  generateGuestAccessToken,
  getCookieConfig,
  validatePassword,
} from "../utils/authUtils";

/* -- Guest User Controllers -- */

/* -- Guest Login -- */
export const guestLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Create a guest user
    const guestUser = await createGuestUser();

    // Generate a guest access token and store it in an HTTP-only cookie (1 day)
    const accessToken = generateGuestAccessToken(guestUser.userId);
    res.cookie(
      "accessToken",
      accessToken,
      getCookieConfig(24 * 60 * 60 * 1000)
    );

    // Send a success response to the client
    res.status(200).json({
      message: "Guest login successful",
      userId: guestUser.userId,
      role: "guest",
    });
    console.log(
      `Guest login successful: Guest user ${guestUser.email} created with ID ${guestUser.userId}`
    );
  } catch (error) {
    console.error("Guest login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* -- Converting guest user to registered user on sign up -- */
export const convertGuestToUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Check if the current session is from a guest user
    if (!req.user || req.user.role !== "guest") {
      res.status(400).json({ error: "No guest session found" });
      console.log("Guest conversion failed: No guest session found");
      return;
    }

    // Get the email, password, first name, and last name from the request body
    const { email, password, firstName, lastName } = req.body;

    // Check if all required fields are provided
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ error: "All fields are required!" });
      console.log("Guest conversion failed: Missing required fields");
      return;
    }

    // Check if the provided email already exists.
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: "Email already exists" });
      console.log(`Guest conversion failed: Email ${email} already exists`);
      return;
    }

    // Hash the new password.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get the guest user's numeric ID from the token.
    const guestUserId = req.user.userId;

    // Create a new permanent user record with the registration details.
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      isGuest: false,
    });
    console.log(
      `Guest conversion successful: Created new user ${newUser.email} with ID ${newUser.userId}`
    );

    // Migrate questionnaire responses from the guest user to the new user
    const guestResponses = await QuestionnaireResponse.findAll({
      where: { userId: guestUserId },
    });

    let questionnaireCount = 0;
    if (guestResponses && guestResponses.length > 0) {
      for (const response of guestResponses) {
        // Create a new response with the new user ID but keep all other data
        await QuestionnaireResponse.create({
          userId: newUser.userId,
          responses: response.responses,
          totalScore: response.totalScore,
          currentQuestion: response.currentQuestion,
        });
        questionnaireCount++;
      }
      console.log(
        `Migrated ${questionnaireCount} questionnaire responses from guest user ${guestUserId} to new user ${newUser.userId}`
      );
    } else {
      console.log(
        `No questionnaire responses found for guest user ${guestUserId}`
      );
    }

    // Migrate habits from the guest user to the new user
    const guestHabits = await Habit.findAll({
      where: { userId: guestUserId },
    });

    let habitCount = 0;
    const habitIdMap = new Map(); // Map old habit IDs to new habit IDs

    if (guestHabits && guestHabits.length > 0) {
      for (const habit of guestHabits) {
        // Create a new habit with the new user ID but keep all other data
        const newHabit = await Habit.create({
          userId: newUser.userId,
          name: habit.name,
          count: habit.count,
        });

        // Store mapping of old habit ID to new habit ID for habit logs
        habitIdMap.set(habit.habitId, newHabit.habitId);
        habitCount++;
      }
      console.log(
        `Migrated ${habitCount} habits from guest user ${guestUserId} to new user ${newUser.userId}`
      );
    } else {
      console.log(`No habits found for guest user ${guestUserId}`);
    }

    // Migrate habit logs from the guest user to the new user
    const guestLogs = await HabitLog.findAll({
      where: { userId: guestUserId },
    });

    let logCount = 0;
    if (guestLogs && guestLogs.length > 0) {
      for (const log of guestLogs) {
        // Get the new habit ID if it exists
        const newHabitId = habitIdMap.get(log.habitId) || log.habitId;

        // Create a new log with the new user ID and updated habit ID
        await HabitLog.create({
          userId: newUser.userId,
          habitId: newHabitId,
          date: log.date,
          count: log.count,
        });
        logCount++;
      }
      console.log(
        `Migrated ${logCount} habit logs from guest user ${guestUserId} to new user ${newUser.userId}`
      );
    } else {
      console.log(`No habit logs found for guest user ${guestUserId}`);
    }

    // Delete the guest user's data in the correct order to avoid foreign key constraint errors
    try {
      // 1. First delete habit logs
      await HabitLog.destroy({ where: { userId: guestUserId } });
      console.log(`Deleted habit logs for guest user ${guestUserId}`);

      // 2. Then delete habits
      await Habit.destroy({ where: { userId: guestUserId } });
      console.log(`Deleted habits for guest user ${guestUserId}`);

      // 3. Delete questionnaire responses
      await QuestionnaireResponse.destroy({ where: { userId: guestUserId } });
      console.log(
        `Deleted questionnaire responses for guest user ${guestUserId}`
      );

      // 4. Finally delete the guest user
      await User.destroy({ where: { userId: guestUserId } });
      console.log(`Deleted guest user ${guestUserId}`);
    } catch (error) {
      console.error(`Error deleting guest user data: ${error}`);
      // Continue with the conversion process even if deletion fails
    }

    // Generate a new access token for the new user
    const newAccessToken = jwt.sign(
      { userId: newUser.userId, role: "user" },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );
    console.log(`Generated new access token for user ${newUser.userId}`);

    // Set the new token in an HTTP-only cookie.
    res.cookie(
      "accessToken",
      newAccessToken,
      getCookieConfig(7 * 24 * 60 * 60 * 1000)
    ); // 7 days

    // Return the new user details (excluding the password).
    res.status(200).json({
      message: "Guest account successfully converted to permanent account",
      user: {
        userId: newUser.userId,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        isGuest: false,
      },
      dataMigrated: {
        questionnaires: questionnaireCount,
        habits: habitCount,
        habitLogs: logCount,
      },
    });
    console.log(
      `Guest conversion completed: User ${newUser.email} (ID: ${newUser.userId}) with ${questionnaireCount} questionnaires, ${habitCount} habits and ${logCount} logs`
    );
  } catch (error) {
    console.error("Error converting guest to user:", error);

    // Handle Sequelize validation errors
    if (error instanceof Error) {
      // Check if it's a Sequelize validation error
      if ("errors" in error && Array.isArray((error as any).errors)) {
        const validationErrors = (error as any).errors;
        const errorMessage = validationErrors
          .map((err: any) => err.message)
          .join(", ");
        res.status(400).json({
          error: `Failed to convert guest account: ${errorMessage}`,
        });
      } else {
        res.status(400).json({
          error: `Failed to convert guest account: ${error.message}`,
        });
      }
    } else {
      res.status(500).json({
        error:
          "Failed to convert guest account due to an unexpected error. Please try again.",
      });
    }
  }
};
