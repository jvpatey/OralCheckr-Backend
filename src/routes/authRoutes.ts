import { Router, Response } from "express";
import { register, login, guestLogin } from "../controllers/authControllers";

const router = Router();
//Register
router.post("/register", register);

// Login
router.post("/login", login);

// Guest login
router.post("/guest-login", guestLogin);

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0),
  });

  res.status(200).json({ message: "Logged out successfully" });
});

export default router;
