import { Router } from "express";
import {
  register,
  login,
  guestLogin,
  logout,
} from "../controllers/authControllers";

const router = Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Guest login
router.post("/guest-login", guestLogin);

// Logout (Now uses the controller)
router.post("/logout", logout);

export default router;
