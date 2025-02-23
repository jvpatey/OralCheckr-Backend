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

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Validate user
router.get("/validate", verifyToken, validateUser);

// Guest login
router.post("/guest-login", guestLogin);

// Guest user convert on new sign up
router.post("/convert-guest", verifyToken, convertGuestToUser);

// Logout
router.post("/logout", logout);

export default router;
