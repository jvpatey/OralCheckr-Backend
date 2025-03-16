import dotenv from "dotenv";
dotenv.config();

// Determine the database dialect based on environment
const isDevelopment = process.env.NODE_ENV === "development";
const defaultDialect = isDevelopment ? "mysql" : "postgres";

// Parse DATABASE_URL if provided
let dbConfig = {
  DB_NAME: process.env.DB_NAME || "default_database",
  DB_USER: process.env.DB_USER || "root",
  DB_PASS: process.env.DB_PASS || "",
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_DIALECT: process.env.DB_DIALECT || defaultDialect,
  DB_PORT: process.env.DB_PORT || (isDevelopment ? "3306" : "5432"), // Default port based on dialect
};

// If DATABASE_URL is provided, parse it
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  dbConfig = {
    DB_NAME: url.pathname.substring(1), // Remove leading slash
    DB_USER: url.username,
    DB_PASS: url.password,
    DB_HOST: url.hostname,
    DB_DIALECT: "postgres", // Render always uses PostgreSQL
    DB_PORT: url.port || "5432",
  };
}

console.log(`Using database dialect: ${dbConfig.DB_DIALECT}`);

export default dbConfig;
