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

// Read base path from environment variables (defaulting to an empty string)
const basePath = process.env.BASE_PATH || "";
app.use(`${basePath}/auth`, authRoutes);

connectDB();

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
