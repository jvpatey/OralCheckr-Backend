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
    await QuestionnaireResponse.update(
      { userId: newUser.userId },
      { where: { userId: guestUserId } }
    );
    console.log(
      `Migrated questionnaire responses from guest user ${guestUserId} to new user ${newUser.userId}`
    );

    // Migrate habits from the guest user to the new user
    await Habit.update(
      { userId: newUser.userId },
      { where: { userId: guestUserId } }
    );
    console.log(
      `Migrated habits from guest user ${guestUserId} to new user ${newUser.userId}`
    );

    // Migrate habit logs from the guest user to the new user
    await HabitLog.update(
      { userId: newUser.userId },
      { where: { userId: guestUserId } }
    );
    console.log(
      `Migrated habit logs from guest user ${guestUserId} to new user ${newUser.userId}`
    );

    // Count how many habits were migrated
    const habitCount = await Habit.count({ where: { userId: newUser.userId } });
    console.log(`Migrated ${habitCount} habits`);

    // Count how many habit logs were migrated
    const logCount = await HabitLog.count({
      where: { userId: newUser.userId },
    });
    console.log(`Migrated ${logCount} habit logs`);

    // Delete the guest user record as it's no longer needed
    await User.destroy({ where: { userId: guestUserId } });
    console.log(`Deleted guest user ${guestUserId}`);

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
      habitsMigrated: habitCount,
      logsMigrated: logCount,
    });
    console.log(
      `Guest conversion completed: User ${newUser.email} (ID: ${newUser.userId}) with ${habitCount} habits and ${logCount} logs`
    );
  } catch (error) {
    console.error("Error converting guest to user:", error);
    res.status(500).json({ error: "Failed to convert guest account" });
  }
};
