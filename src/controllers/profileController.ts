import { Response } from "express";
import User from "../models/userModel";
import { AuthenticatedRequest } from "../interfaces/auth";
import { validatePassword } from "../utils/authUtils";
import HabitLog from "../models/habitLogModel";
import Habit from "../models/habitModel";
import QuestionnaireResponse from "../models/questionnaireResponseModel";
import { ProfileUpdateData } from "../interfaces/profile";
import { UserResponse } from "../interfaces/auth";

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

    // Check if user is a guest
    if (user.isGuest) {
      res.status(403).json({
        error: "Guest users cannot access profile",
        isGuest: true,
      });
      return;
    }

    // Send a success response to the client
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    if (error instanceof Error) {
      res
        .status(400)
        .json({ error: `Failed to fetch profile: ${error.message}` });
    } else {
      res.status(500).json({
        error:
          "Failed to fetch profile due to an unexpected error. Please try again.",
      });
    }
  }
};

/* -- Update User Profile -- */
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the fields from the request body
    const { firstName, lastName, email, avatar } = req.body;

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

    // Create update object with only provided fields
    const updateData: ProfileUpdateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Update user fields
    await user.update(updateData);

    // Refresh user data to get updated values
    const updatedUser = await User.findByPk(userId);

    if (!updatedUser) {
      res.status(404).json({ error: "User not found after update" });
      return;
    }

    // Create user response object
    const userResponse: UserResponse = {
      userId: updatedUser.userId,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      isGuest: updatedUser.isGuest,
    };

    // Send a success response to the client
    res.status(200).json({
      message: "Profile updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    if (error instanceof Error) {
      res
        .status(400)
        .json({ error: `Failed to update profile: ${error.message}` });
    } else {
      res.status(500).json({
        error:
          "Failed to update profile due to an unexpected error. Please try again.",
      });
    }
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

    // Delete all associated data
    await HabitLog.destroy({ where: { userId } });
    await Habit.destroy({ where: { userId } });
    await QuestionnaireResponse.destroy({ where: { userId } });

    // Delete user account
    await user.destroy();

    // Clear the authentication cookie
    res.clearCookie("accessToken");

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    if (error instanceof Error) {
      res
        .status(400)
        .json({ error: `Failed to delete account: ${error.message}` });
    } else {
      res.status(500).json({
        error:
          "Failed to delete account due to an unexpected error. Please try again.",
      });
    }
  }
};
