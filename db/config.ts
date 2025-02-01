import dotenv from "dotenv";
dotenv.config();

const config = {
  host: process.env.HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.PASSWORD || "",
  database: process.env.DATABASE || "default_database",
};

export default config;
