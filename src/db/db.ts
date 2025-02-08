import { Sequelize } from "sequelize";
import config from "./config";

const sequelize = new Sequelize(
  config.DB_NAME,
  config.DB_USER,
  config.DB_PASS,
  {
    host: config.DB_HOST,
    dialect: config.DB_DIALECT as any,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Test connection on startup
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to MySQL database via Sequelize");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};

connectDB();

export default sequelize;
