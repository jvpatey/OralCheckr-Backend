import { Sequelize } from "sequelize";
import config from "./config";

// Configure SSL options based on environment and dialect
const sslConfig =
  process.env.NODE_ENV === "production" && config.DB_DIALECT === "postgres"
    ? {
        require: true,
        rejectUnauthorized: false,
      }
    : false;

const sequelize = new Sequelize(
  config.DB_NAME,
  config.DB_USER,
  config.DB_PASS,
  {
    host: config.DB_HOST,
    dialect: config.DB_DIALECT as any,
    port: parseInt(config.DB_PORT, 10),
    logging: false,
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

// Test connection function - but don't call it automatically
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
