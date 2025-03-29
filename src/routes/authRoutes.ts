import { Router } from "express";
import {
  register,
  login,
  guestLogin,
  logout,
  validateUser,
  convertGuestToUser,
  getUserProfile,
} from "../controllers/authControllers";
import { verifyToken } from "../middlewares/authMiddleware";

const router = Router();

/* -- Auth Routes -- */
router.post("/register", register); // Register a user
router.post("/login", login); // Login a user
router.get("/validate", verifyToken, validateUser); // Validate user
router.post("/guest-login", guestLogin); // Guest login
router.post("/logout", logout); // Logout a user
router.get("/profile", verifyToken, getUserProfile); // Get user profile info
router.post("/convert-guest", verifyToken, convertGuestToUser); // Guest user convert on new sign up

export default router;
