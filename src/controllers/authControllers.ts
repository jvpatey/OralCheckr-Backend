import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import User from "../models/userModel";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import QuestionnaireResponse from "../models/questionnaireResponseModel";
import Habit from "../models/habitModel";
import HabitLog from "../models/habitLogModel";
import { OAuth2Client } from "google-auth-library";
import {
  generateAccessToken,
  validatePassword,
  createGuestUser,
  getCookieConfig,
  generateGuestAccessToken,
} from "../utils/authUtils";

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* -- Register a user -- */
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, firstName, lastName } = req.body;

  console.log(`Registering user: ${email}`);
  if (!email || !password || !firstName || !lastName) {
    res.status(400).json({ error: "All fields are required!" });
    console.log("Registration failed: Missing required fields");
    return;
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    console.log(
      `Registration failed: Password validation failed - ${passwordError}`
    );
    return;
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: "Email already exists" });
      console.log(`Registration failed: Email ${email} already exists`);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    const accessToken = generateAccessToken(newUser.userId);

    // Store token in an HTTP-only cookie
    res.cookie(
      "accessToken",
      accessToken,
      getCookieConfig(7 * 24 * 60 * 60 * 1000)
    ); // 7 days

    res
      .status(201)
      .json({ message: "User created successfully", userId: newUser.userId });
    console.log(
      `Registration successful: User ${newUser.email} created with ID ${newUser.userId}`
    );
  } catch (error) {
    console.error(`Registration error for ${email}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* -- Login a user -- */
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    console.log("Login failed: Missing email or password");
    res.status(400).json({ error: "Email or Password cannot be empty!" });
    return;
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log(`Login failed: User ${email} not found`);
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log(`Login failed: Invalid password for user ${email}`);
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const accessToken = generateAccessToken(user.userId);

    // Store token in an HTTP-only cookie
    res.cookie(
      "accessToken",
      accessToken,
      getCookieConfig(7 * 24 * 60 * 60 * 1000)
    ); // 7 days

    res.status(200).json({ message: "Login successful", userId: user.userId });
    console.log(
      `Login successful: User ${user.email} logged in with ID ${user.userId}`
    );
  } catch (error) {
    console.error(`Login error for ${email}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* -- Guest Login -- */
export const guestLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const guestUser = await createGuestUser();
    const accessToken = generateGuestAccessToken(guestUser.userId);

    // Store token in an HTTP-only cookie
    res.cookie(
      "accessToken",
      accessToken,
      getCookieConfig(24 * 60 * 60 * 1000)
    ); // 1 day

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

/* -- Log out -- */
export const logout = (req: Request, res: Response): void => {
  try {
    res.clearCookie("accessToken", getCookieConfig());

    res.status(200).json({ message: "Logged out successfully" });
    console.log("Logout successful");
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* -- Validating the user credentials -- */
export const validateUser = (
  req: AuthenticatedRequest,
  res: Response
): void => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized: No user found" });
    console.log("User validation failed: No user found");
    return;
  }
  res.status(200).json({ user: req.user });
  console.log(
    `User validation successful: User ID ${req.user.userId}${
      req.user.email ? ` (${req.user.email})` : ""
    }`
  );
};

/* -- Converting guest user to registered user on sign up -- */
export const convertGuestToUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Ensure the current session is from a guest user.
    if (!req.user || req.user.role !== "guest") {
      res.status(400).json({ error: "No guest session found" });
      console.log("Guest conversion failed: No guest session found");
      return;
    }

    const { email, password, firstName, lastName } = req.body;
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

    // Merge questionnaire responses:
    await QuestionnaireResponse.update(
      { userId: newUser.userId },
      { where: { userId: guestUserId } }
    );
    console.log(
      `Migrated questionnaire responses from guest user ${guestUserId} to new user ${newUser.userId}`
    );

    // Migrate habits - update the userId
    await Habit.update(
      { userId: newUser.userId },
      { where: { userId: guestUserId } }
    );
    console.log(
      `Migrated habits from guest user ${guestUserId} to new user ${newUser.userId}`
    );

    // Migrate habit logs - update the userId
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

    // Delete the guest user record as it's no longer needed.
    await User.destroy({ where: { userId: guestUserId } });
    console.log(`Deleted guest user ${guestUserId}`);

    // Generate a new access token for the new user.
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

/* -- Get user profile information -- */
export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: "Unauthorized: No user found" });
      console.log("Profile fetch failed: No user found");
      return;
    }

    const user = await User.findByPk(req.user.userId, {
      attributes: [
        "userId",
        "firstName",
        "lastName",
        "email",
        "isGuest",
        "avatar",
      ],
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      console.log(`Profile fetch failed: User ${req.user.userId} not found`);
      return;
    }

    // Check if user is a guest
    if (user.isGuest) {
      res.status(403).json({
        error: "Access denied: Guest users cannot access profile information",
        isGuest: true,
      });
      console.log(`Profile access denied: Guest user ${user.email}`);
      return;
    }

    res.status(200).json({
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isGuest: user.isGuest,
      avatar: user.avatar,
    });
    console.log(`Profile fetch successful: User ${user.email}`);
  } catch (error) {
    console.error(`Profile fetch error: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* -- Update user profile -- */
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: "Unauthorized: No user found" });
      console.log("Profile update failed: No user found");
      return;
    }

    const { avatar, email, currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      console.log(`Profile update failed: User ${req.user.userId} not found`);
      return;
    }

    // Check if user is a guest
    if (user.isGuest) {
      res.status(403).json({
        error: "Access denied: Guest users cannot update profile",
        isGuest: true,
      });
      console.log(`Profile update denied: Guest user ${user.email}`);
      return;
    }

    // Handle email update
    if (email && email !== user.email) {
      // Check if new email already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(409).json({ error: "Email already exists" });
        console.log(`Profile update failed: Email ${email} already exists`);
        return;
      }
      user.email = email;
    }

    // Handle password update
    if (newPassword) {
      if (!currentPassword) {
        res
          .status(400)
          .json({ error: "Current password is required to change password" });
        console.log("Profile update failed: Current password not provided");
        return;
      }

      // Verify current password
      const passwordMatch = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!passwordMatch) {
        res.status(401).json({ error: "Current password is incorrect" });
        console.log("Profile update failed: Current password incorrect");
        return;
      }

      // Validate new password
      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        res.status(400).json({ error: passwordError });
        console.log(
          `Profile update failed: New password validation failed - ${passwordError}`
        );
        return;
      }

      // Hash and update new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    // Update avatar if provided
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();

    res.status(200).json({
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      isGuest: user.isGuest,
    });

    console.log(`Profile updated successfully for user ${user.email}`);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* -- Delete user account -- */
export const deleteAccount = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: "Unauthorized: No user found" });
      console.log("Account deletion failed: No user found");
      return;
    }

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      console.log(`Account deletion failed: User ${req.user.userId} not found`);
      return;
    }

    // Check if user is a guest
    if (user.isGuest) {
      res.status(403).json({
        error: "Access denied: Guest users cannot delete their account",
        isGuest: true,
      });
      console.log(`Account deletion denied: Guest user ${user.email}`);
      return;
    }

    // Delete all user-related data in the correct order
    // 1. Delete habit logs
    await HabitLog.destroy({ where: { userId: req.user.userId } });
    console.log(`Deleted habit logs for user ${req.user.userId}`);

    // 2. Delete habits
    await Habit.destroy({ where: { userId: req.user.userId } });
    console.log(`Deleted habits for user ${req.user.userId}`);

    // 3. Delete questionnaire responses
    await QuestionnaireResponse.destroy({ where: { userId: req.user.userId } });
    console.log(`Deleted questionnaire responses for user ${req.user.userId}`);

    // 4. Delete the user account
    await user.destroy();
    console.log(`Deleted user account ${user.email}`);

    // Clear the authentication cookie with the same options used when setting it
    res.clearCookie("accessToken", getCookieConfig());

    res.status(200).json({ message: "Account deleted successfully" });
    console.log(`Account deletion successful for user ${user.email}`);
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
};

/* -- Google Login -- */
export const googleLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { credential } = req.body;
    if (!credential) {
      res.status(400).json({ error: "Google credential is required" });
      console.log("Google login failed: No credential provided");
      return;
    }

    console.log(
      `Google login attempt with client ID: ${process.env.GOOGLE_CLIENT_ID}`
    );

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ error: "Invalid Google token" });
      console.log("Google login failed: Invalid token or missing email");
      return;
    }

    const { email, given_name, family_name, sub: googleId } = payload;

    // Check if user already exists
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Create new user if they don't exist
      const salt = await bcrypt.genSalt(10);
      // Create a secure random password
      const randomPassword =
        Math.random().toString(36).slice(-10) +
        Math.random().toString(36).slice(-10) +
        "A1!";
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        firstName: given_name || "Google",
        lastName: family_name || "User",
        email,
        password: hashedPassword,
        googleId,
      });
      console.log(`New user created from Google login: ${email}`);
    } else if (!user.googleId) {
      // Update existing user with Google ID if they logged in with email/password before
      user.googleId = googleId;
      await user.save();
      console.log(`Updated existing user with Google ID: ${email}`);
    }

    // Generate token
    const accessToken = generateAccessToken(user.userId);

    // Set cookie
    res.cookie(
      "accessToken",
      accessToken,
      getCookieConfig(7 * 24 * 60 * 60 * 1000)
    ); // 7 days

    res
      .status(200)
      .json({ message: "Google login successful", userId: user.userId });
    console.log(`Google login successful for user ${user.email}`);
  } catch (error: any) {
    console.error("Google login error:", error);

    // Check for audience mismatch error
    if (
      error.message &&
      (error.message.includes("Wrong recipient") ||
        error.message.includes("audience"))
    ) {
      console.error(
        "Google Client ID mismatch. Check that your frontend and backend Client IDs match."
      );
      console.error(
        `Current backend Client ID: ${process.env.GOOGLE_CLIENT_ID}`
      );
      res.status(400).json({
        error: "Google authentication configuration error",
        message:
          "There is a mismatch between your frontend and backend Google configuration.",
      });
      return;
    }

    res.status(500).json({ error: "Google authentication failed" });
  }
};
