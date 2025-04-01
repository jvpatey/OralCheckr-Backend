import express from "express";
import {
  register,
  login,
  logout,
  validateUser,
} from "../controllers/authController";
import { guestLogin, convertGuestToUser } from "../controllers/guestController";
import {
  getProfile,
  updateProfile,
  deleteAccount,
} from "../controllers/profileController";
import { googleLogin } from "../controllers/googleAuthController";
import { verifyToken } from "../middlewares/authMiddleware";

const router = express.Router();

/* -- Auth Routes -- */
router.post("/register", register); // Register a user
router.post("/login", login); // Login a user
router.post("/logout", logout); // Logout a user
router.get("/validate", verifyToken, validateUser); // Validate user token

/* -- Guest Routes -- */
router.post("/guest-login", guestLogin); // Guest login
router.post("/convert-guest", verifyToken, convertGuestToUser); // Guest user convert on new sign up

/* -- Profile Routes -- */
router.get("/profile", verifyToken, getProfile); // Get user profile info
router.put("/profile", verifyToken, updateProfile); // Update user profile
router.delete("/profile", verifyToken, deleteAccount); // Delete user account

/* -- Google OAuth Routes -- */
router.post("/google-login", googleLogin); // Google OAuth login

export default router;
