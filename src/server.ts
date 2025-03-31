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

// Load environment variables
dotenv.config();
const port = process.env.PORT || 3000;
const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://jvpatey.github.io",
  "https://oralcheckr-backend.onrender.com",
];

// CORS options
const corsOptions = {
  // Allow credentials
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    // Filter out empty strings from allowedOrigins
    const validOrigins = allowedOrigins.filter((o) => o);

    // If the origin is not allowed, return an error
    if (!origin || validOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`Origin ${origin} not allowed by CORS`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  // Allow credentials
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cookie",
    "Origin",
    "Accept",
  ],
  exposedHeaders: ["Set-Cookie"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Log the CORS configuration
console.log(
  `CORS configured for ${
    process.env.NODE_ENV
  } environment with allowed origins: ${allowedOrigins
    .filter((o) => o)
    .join(", ")}`
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

// Debug logging for auth requests (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    if (req.path.startsWith("/auth")) {
      console.log("Auth request:", {
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
        origin: req.headers.origin || "No origin",
      });
    }
    next();
  });
}

/* -- API Routes -- */
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", environment: process.env.NODE_ENV });
}); // Render health check
app.use("/auth", authRoutes); // Authentication & user management
app.use("/questionnaire", questionnaireRoutes); // Questionnaire responses
app.use("/habits", habitRoutes); // Habit management
app.use("/habit-logs", habitLogRoutes); // Habit logging and tracking

console.log(`Running in ${process.env.NODE_ENV} mode.`);

/* -- Server Startup Function -- */

// Start the server
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

// Export the Express app
export default app;
