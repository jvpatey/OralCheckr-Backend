import { Router } from "express";
import {
  register,
  login,
  guestLogin,
  logout,
  validateUser,
} from "../controllers/authControllers";
import { verifyToken } from "../middlewares/authMiddleware";

const router = Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Guest login
router.post("/guest-login", guestLogin);

// Validate user
router.get("/validate", verifyToken, validateUser);

// Logout
router.post("/logout", logout);

export default router;
