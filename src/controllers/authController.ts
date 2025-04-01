import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/userModel";
import {
  generateAccessToken,
  validatePassword,
  getCookieConfig,
} from "../utils/authUtils";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

/* -- Authentication Controllers -- */

/* -- Register a user -- */
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, firstName, lastName } = req.body;
  console.log(`Registering user: ${email}`);

  // Check if all required fields are provided
  if (!email || !password || !firstName || !lastName) {
    res.status(400).json({ error: "All fields are required!" });
    console.log("Registration failed: Missing required fields");
    return;
  }

  // Validate the password
  const passwordError = validatePassword(password);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    console.log(
      `Registration failed: Password validation failed - ${passwordError}`
    );
    return;
  }

  // Check if the email already exists
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: "Email already exists" });
      console.log(`Registration failed: Email ${email} already exists`);
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the new user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    // Generate an access token for the new user and store it in an HTTP-only cookie
    const accessToken = generateAccessToken(newUser.userId);
    res.cookie(
      "accessToken",
      accessToken,
      getCookieConfig(7 * 24 * 60 * 60 * 1000)
    );

    // Send a success response to the client
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

/* -- User Login (email and password) -- */
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // Check if all required fields are provided
  if (!email || !password) {
    console.log("Login failed: Missing email or password");
    res.status(400).json({ error: "Email or Password cannot be empty!" });
    return;
  }

  // Check if the user exists
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log(`Login failed: User ${email} not found`);
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Check if the entered password is correct
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log(`Login failed: Invalid password for user ${email}`);
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Generate an access token for the user and store it in an HTTP-only cookie
    const accessToken = generateAccessToken(user.userId);
    res.cookie(
      "accessToken",
      accessToken,
      getCookieConfig(7 * 24 * 60 * 60 * 1000)
    );

    // Send a success response to the client
    res.status(200).json({ message: "Login successful", userId: user.userId });
    console.log(
      `Login successful: User ${user.email} logged in with ID ${user.userId}`
    );
  } catch (error) {
    console.error(`Login error for ${email}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* -- Log out -- */
export const logout = (req: Request, res: Response): void => {
  try {
    // Clear the access token from the HTTP-only cookie
    res.clearCookie("accessToken", getCookieConfig());

    // Send a success response to the client
    res.status(200).json({ message: "Logged out successfully" });
    console.log("Logout successful");
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* -- Validate User Token (for protected routes) -- */
export const validateUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Find the user by their ID and exclude the password from the response
    const user = await User.findByPk(req.user?.userId, {
      attributes: { exclude: ["password"] },
    });

    // Check if the user exists
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Send a success response to the client
    res.status(200).json({
      user: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        isGuest: user.isGuest,
      },
    });
  } catch (error) {
    console.error("Error validating user:", error);
    res.status(500).json({ error: "Failed to validate user" });
  }
};
