import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import sequelize from "./db/db";
import authRoutes from "./routes/authRoutes";

dotenv.config();

const port = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set base path from environment variable
const basePath = process.env.BASE_PATH || "";
app.use(`${basePath}/auth`, authRoutes);

// Log the environment and base path
console.log(`Running in ${process.env.NODE_ENV} mode. Base path: ${basePath}`);

// Sync models and start server only if not in test mode
if (process.env.NODE_ENV !== "test") {
  sequelize
    .sync()
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
