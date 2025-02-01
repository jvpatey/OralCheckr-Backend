import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db/db.ts";
import authRoutes from "./routes/authRoutes.ts";

dotenv.config();

const port = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// If in development, use an empty string for base path; otherwise, use the BASE_PATH from .env.
const basePath =
  process.env.NODE_ENV === "development" ? "" : process.env.BASE_PATH || "";
app.use(`${basePath}/auth`, authRoutes);

// Log the environment in use
if (process.env.NODE_ENV === "development") {
  console.log("Running in development mode.");
} else {
  console.log(`Running in production mode. Using base path: ${basePath}`);
}

connectDB();

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
