import { Sequelize } from "sequelize";
import config from "./config";

/* -- Database Connection Module -- */

// SSL is required for PostgreSQL on Render, but not for local MySQL
const sslConfig =
  process.env.NODE_ENV === "production" && config.DB_DIALECT === "postgres"
    ? {
        require: true,
        rejectUnauthorized: false, // Required for Render PostgreSQL
      }
    : false;

/* -- Create Sequelize instance -- */
const sequelize = new Sequelize(
  config.DB_NAME,
  config.DB_USER,
  config.DB_PASS,
  {
    host: config.DB_HOST,
    dialect: config.DB_DIALECT as any,
    port: parseInt(config.DB_PORT, 10),
    logging: false, // Set to console.log to see SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl: sslConfig,
    },
  }
);

/* -- Test database connection -- */

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`Connected to ${config.DB_DIALECT} database via Sequelize`);
    return true;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return false;
  }
};

export default sequelize;
