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
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? ["https://jvpatey.github.io", "https://jvpatey.github.io/OralCheckr"]
      : "http://localhost:5173",
  credentials: true,
};

console.log(`CORS configured for ${process.env.NODE_ENV} environment`);

/* -- Middleware Configuration -- */
// Enable CORS with credentials for the frontend
app.use(cors(corsOptions));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies (form submissions)
app.use(express.urlencoded({ extended: false }));

// Parse cookies from request headers
app.use(cookieParser());

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
