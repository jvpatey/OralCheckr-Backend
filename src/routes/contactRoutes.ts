import express from "express";
import rateLimit from "express-rate-limit";
import { sendContactEmail } from "../controllers/contactController";

const router = express.Router();

// Rate limiter to prevent spam
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: "Too many contact requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/contact
 * @desc    Send contact form email
 * @access  Public
 */
router.post("/", contactLimiter, sendContactEmail);

export default router;
