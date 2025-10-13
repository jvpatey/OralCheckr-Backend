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
import contactRoutes from "./routes/contactRoutes";
import { corsOptions } from "./config/corsConfig";
import { addCrossOriginHeaders } from "./middlewares/common";

/* -- OralCheckr Backend Server -- */

// Load environment variables from .env file
dotenv.config();
const port = process.env.PORT || 3000;
const app = express();

/* -- Middleware Configuration -- */

// Parse cookies from request headers
app.use(cookieParser());

// Enable CORS with configured options
app.use(cors(corsOptions));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: false }));

// Add Cross-Origin headers for Google Auth
app.use(addCrossOriginHeaders);

/* -- API Routes -- */

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", environment: process.env.NODE_ENV });
});

// Mount route handlers
app.use("/auth", authRoutes); // Authentication & user management
app.use("/questionnaire", questionnaireRoutes); // Questionnaire responses
app.use("/habits", habitRoutes); // Habit management
app.use("/habit-logs", habitLogRoutes); // Habit logging and tracking
app.use("/api/contact", contactRoutes); // Contact form email

console.log(`Running in ${process.env.NODE_ENV} mode.`);

/* -- Start the server -- */
const startServer = async () => {
  try {
    // Only connect to database if not in test mode
    if (process.env.NODE_ENV !== "test") {
      // Establish database connection
      const connected = await connectDB();
      if (!connected) {
        console.error("Could not connect to database. Server will not start.");
        return;
      }

      // Synchronize models with the database
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

// Only start if not in test mode and the file is being run directly
if (process.env.NODE_ENV !== "test" && require.main === module) {
  startServer();
}

export default app;
