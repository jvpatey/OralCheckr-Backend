import dotenv from "dotenv";
dotenv.config();

/* -- Database Configuration -- */

// Determine if the environment is development
const isDevelopment = process.env.NODE_ENV === "development";

// Determine the default dialect = mysql or postgres
const defaultDialect = isDevelopment ? "mysql" : "postgres";

// Set the default database config
let dbConfig = {
  DB_NAME: process.env.DB_NAME || "default_database",
  DB_USER: process.env.DB_USER || "root",
  DB_PASS: process.env.DB_PASS || "",
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_DIALECT: process.env.DB_DIALECT || defaultDialect,
  DB_PORT: process.env.DB_PORT || (isDevelopment ? "3306" : "5432"),
};

// If the DATABASE_URL is provided, use it
if (process.env.DATABASE_URL) {
  console.log("Using DATABASE_URL for database connection");

  // Parse the connection string into its components
  const url = new URL(process.env.DATABASE_URL);

  // Set the database config
  dbConfig = {
    DB_NAME: url.pathname.substring(1),
    DB_USER: url.username,
    DB_PASS: url.password,
    DB_HOST: url.hostname,
    DB_DIALECT: "postgres", // Render always uses PostgreSQL
    DB_PORT: url.port || "5432",
  };
}

// Log the database config
console.log(`Using database dialect: ${dbConfig.DB_DIALECT}`);
console.log(
  `Connecting to database: ${dbConfig.DB_NAME} on ${dbConfig.DB_HOST}`
);

export default dbConfig;
