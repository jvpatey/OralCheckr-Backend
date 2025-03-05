import { Router } from "express";
import {
  register,
  login,
  guestLogin,
  logout,
  validateUser,
  convertGuestToUser,
} from "../controllers/authControllers";
import { verifyToken } from "../middlewares/authMiddleware";

const router = Router();

/* -- Auth Routes -- */
router.post("/register", register); // Register a user
router.post("/login", login); // Login a user
router.get("/validate", verifyToken, validateUser); // Validate user
router.post("/guest-login", guestLogin); // Guest login
router.post("/convert-guest", verifyToken, convertGuestToUser); // Guest user convert on new sign up
router.post("/logout", logout); // Logout a user

export default router;
