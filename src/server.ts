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

// Determine base path
const basePath =
  process.env.NODE_ENV === "development" ? "" : process.env.BASE_PATH || "";
app.use(`${basePath}/auth`, authRoutes);

// Log the environment in use
if (process.env.NODE_ENV === "development") {
  console.log("Running in development mode.");
} else {
  console.log(`Running in production mode. Using base path: ${basePath}`);
}

// Sync models and start server
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
