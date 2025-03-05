import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import User from "../models/userModel";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import QuestionnaireResponse from "../models/questionnaireResponseModel";
import Habit from "../models/habitModel";
import HabitLog from "../models/habitLogModel";

const generateAccessToken = (userId: number): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
};

// Validate password
const validatePassword = (password: string): string | null => {
  const requirements = [
    { regex: /.{8,}/, message: "Password must be at least 8 characters" },
    { regex: /[A-Z]/, message: "Must contain at least one uppercase letter" },
    { regex: /[a-z]/, message: "Must contain at least one lowercase letter" },
    { regex: /\d/, message: "Must contain at least one digit" },
    {
      regex: /[!@#$%^&*(),.?":{}|<>]/,
      message: "Must contain at least one special character",
    },
  ];

  const errors = requirements
    .filter((req) => !req.regex.test(password))
    .map((req) => req.message);
  return errors.length > 0 ? errors.join(", ") : null;
};

// Register a user
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    res.status(400).json({ error: "All fields are required!" });
    return;
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: "Email already exists" });
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
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res
      .status(201)
      .json({ message: "User created successfully", userId: newUser.userId });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Login a user
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email or Password cannot be empty!" });
    return;
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const accessToken = generateAccessToken(user.userId);

    // Store token in an HTTP-only cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({ message: "Login successful", userId: user.userId });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Guest Login
const generateGuestAccessToken = (guestUserId: number): string => {
  return jwt.sign(
    { userId: guestUserId, role: "guest" },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "1d",
    }
  );
};

export const guestLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const guestUser = await User.createGuest();
    const accessToken = generateGuestAccessToken(guestUser.userId);

    // Store token in an HTTP-only cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
      message: "Guest login successful",
      userId: guestUser.userId,
      role: "guest",
    });
  } catch (error) {
    console.error("Guest login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Log out
export const logout = (req: Request, res: Response): void => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Validating the user credentials
export const validateUser = (
  req: AuthenticatedRequest,
  res: Response
): void => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized: No user found" });
    return;
  }
  res.status(200).json({ user: req.user });
};

// Converting guest user to registered user on sign up
export const convertGuestToUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Ensure the current session is from a guest user.
    if (!req.user || req.user.role !== "guest") {
      res.status(400).json({ error: "No guest session found" });
      return;
    }

    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ error: "All fields are required!" });
      return;
    }

    // Check if the provided email already exists.
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: "Email already exists" });
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

    // Merge questionnaire responses:
    // Update all responses that belong to the guest user to use the new user's ID.
    await QuestionnaireResponse.update(
      { userId: newUser.userId },
      { where: { userId: guestUserId } }
    );

    // Migrate habits - update the userId
    await Habit.update(
      { userId: newUser.userId },
      { where: { userId: guestUserId } }
    );

    // Migrate habit logs - update the userId
    await HabitLog.update(
      { userId: newUser.userId },
      { where: { userId: guestUserId } }
    );

    // Count how many habits were migrated
    const habitCount = await Habit.count({ where: { userId: newUser.userId } });

    // Count how many habit logs were migrated
    const logCount = await HabitLog.count({
      where: { userId: newUser.userId },
    });

    // Delete the guest user record as it's no longer needed.
    await User.destroy({ where: { userId: guestUserId } });

    // Generate a new access token for the new user.
    const newAccessToken = jwt.sign(
      { userId: newUser.userId, role: "user" },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    // Set the new token in an HTTP-only cookie.
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

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
  } catch (error) {
    console.error("Error converting guest to user:", error);
    res.status(500).json({ error: "Failed to convert guest account" });
  }
};
