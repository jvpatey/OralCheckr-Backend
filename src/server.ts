import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import sequelize from "./db/db";
import { connectDB } from "./db/db";
import authRoutes from "./routes/authRoutes";
import questionnaireRoutes from "./routes/questionnaireRoutes";
import habitRoutes from "./routes/habitRoutes";
import habitLogRoutes from "./routes/habitLogRoutes";

/* -- OralCheckr Backend Server -- */

// Load environment variables from .env file
dotenv.config();

// Server configuration
const port = process.env.PORT || 3000;
const app = express();

// CORS configuration for frontend access
const allowedOrigins = ["http://localhost:5173", "https://jvpatey.github.io"];

const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposedHeaders: ["set-cookie"],
};

console.log(
  `CORS configured for ${
    process.env.NODE_ENV
  } environment with allowed origins: ${allowedOrigins.join(", ")}`
);

/* -- Middleware Configuration -- */
// Parse cookies from request headers
app.use(cookieParser());

// Enable CORS with credentials for the frontend
app.use(cors(corsOptions));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies (form submissions)
app.use(express.urlencoded({ extended: false }));

// Debug logging for auth requests
app.use((req, res, next) => {
  if (req.path.startsWith("/auth")) {
    console.log("Auth request:", {
      path: req.path,
      method: req.method,
      cookies: req.cookies,
      headers: {
        origin: req.headers.origin,
        cookie: req.headers.cookie || "No cookie present",
      },
    });
  }
  next();
});

/* -- API Routes -- */
// Health check endpoint for monitoring and Render's health checks
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", environment: process.env.NODE_ENV });
});

// Mount route modules
app.use("/auth", authRoutes); // Authentication & user management
app.use("/questionnaire", questionnaireRoutes); // Questionnaire responses
app.use("/habits", habitRoutes); // Habit management
app.use("/habit-logs", habitLogRoutes); // Habit logging and tracking

console.log(`Running in ${process.env.NODE_ENV} mode.`);

/* -- Server Startup Function -- */

const startServer = async () => {
  try {
    // Only connect to database if not in test mode
    if (process.env.NODE_ENV !== "test") {
      // First establish database connection
      const connected = await connectDB();
      if (!connected) {
        console.error("Could not connect to database. Server will not start.");
        return;
      }

      // Then synchronize models with the database
      // The 'alter: true' option updates tables to match models
      await sequelize.sync({ alter: true });
      console.log("All models synchronized successfully.");
    }

    // Start the Express server
    app.listen(port, () => {
      console.log(`Server running on port: ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

// Only start if:
// 1. Not in test mode (prevents test runs from starting the server)
// 2. This file is being run directly (not imported by another file)
if (process.env.NODE_ENV !== "test" && require.main === module) {
  startServer();
}

// Export the Express app for testing
export default app;
