import dotenv from "dotenv";
dotenv.config();

const config = {
  DB_NAME: process.env.DB_NAME || "default_database",
  DB_USER: process.env.DB_USER || "root",
  DB_PASS: process.env.DB_PASS || "",
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_DIALECT: "mysql",
};

export default config;
