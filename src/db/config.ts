import dotenv from "dotenv";
dotenv.config();

/* -- Database Configuration -- */

// Determine the database dialect based on environment
const isDevelopment = process.env.NODE_ENV === "development";
const defaultDialect = isDevelopment ? "mysql" : "postgres";

// Default configuration using individual environment variables
let dbConfig = {
  DB_NAME: process.env.DB_NAME || "default_database",
  DB_USER: process.env.DB_USER || "root",
  DB_PASS: process.env.DB_PASS || "",
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_DIALECT: process.env.DB_DIALECT || defaultDialect,
  DB_PORT: process.env.DB_PORT || (isDevelopment ? "3306" : "5432"), // MySQL uses 3306, PostgreSQL uses 5432
};

// Parse DATABASE_URL if provided (Render PostgreSQL format)
if (process.env.DATABASE_URL) {
  console.log("Using DATABASE_URL for database connection");

  // Parse the connection string into its components
  const url = new URL(process.env.DATABASE_URL);

  // Override the individual config values with those from the URL
  dbConfig = {
    DB_NAME: url.pathname.substring(1), // Remove leading slash from pathname to get database name
    DB_USER: url.username,
    DB_PASS: url.password,
    DB_HOST: url.hostname,
    DB_DIALECT: "postgres", // Render always uses PostgreSQL
    DB_PORT: url.port || "5432",
  };
}

console.log(`Using database dialect: ${dbConfig.DB_DIALECT}`);
console.log(
  `Connecting to database: ${dbConfig.DB_NAME} on ${dbConfig.DB_HOST}`
);

export default dbConfig;
