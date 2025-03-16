import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import sequelize from "./db/db";
import authRoutes from "./routes/authRoutes";
import questionnaireRoutes from "./routes/questionnaireRoutes";
import habitRoutes from "./routes/habitRoutes";
import habitLogRoutes from "./routes/habitLogRoutes";

dotenv.config();

const port = process.env.PORT || 3000;
const app = express();

// Get frontend URL from environment variable with fallback
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
console.log(`Allowing CORS for: ${frontendUrl}`);

/* -- Middleware -- */
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/* -- Routes -- */
// Health check endpoint for Render
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", environment: process.env.NODE_ENV });
});

app.use("/auth", authRoutes); // Auth routes
app.use("/questionnaire", questionnaireRoutes); // Questionnaire routes
app.use("/habits", habitRoutes); // Habit routes
app.use("/habit-logs", habitLogRoutes); // Habit log routes

console.log(`Running in ${process.env.NODE_ENV} mode.`);

/* -- Sync models and start server only if not in test mode -- */
if (process.env.NODE_ENV !== "test") {
  sequelize
    .sync({ alter: true })
    .then(() => {
      console.log("All models synchronized successfully.");
      app.listen(port, () => {
        console.log(`Server running on port: ${port}`);
      });
    })
    .catch((error) => {
      console.error("Failed to synchronize models:", error);
      process.exit(1);
    });
}

export default app;
