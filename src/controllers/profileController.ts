import { Request, Response } from "express";
import User from "../models/userModel";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { validatePassword } from "../utils/authUtils";

/* -- User Profile Controllers -- */

/* -- Get User Profile -- */
export const getProfile = async (
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
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

/* -- Update User Profile -- */
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the first name, last name, and email from the request body
    const { firstName, lastName, email } = req.body;

    // Check if the user is authenticated
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Find the user by their ID
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if the email already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(409).json({ error: "Email already exists" });
        return;
      }
    }

    // Update user fields
    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      email: email || user.email,
    });

    // Send a success response to the client
    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isGuest: user.isGuest,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

/* -- Change Password -- */
export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the current password and new password from the request body
    const { currentPassword, newPassword } = req.body;

    // Check if the user is authenticated
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Find the user by their ID
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Validate current password
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      res.status(400).json({ error: passwordError });
      return;
    }

    // Update password
    await user.update({ password: newPassword });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};

/* -- Delete Account -- */
export const deleteAccount = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the user's ID
    const userId = req.user?.userId;

    // Check if the user is authenticated
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Find the user by their ID
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Delete user account
    await user.destroy();

    // Clear the authentication cookie
    res.clearCookie("accessToken");

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
};
