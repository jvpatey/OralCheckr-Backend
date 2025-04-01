import { Sequelize } from "sequelize";
import config from "./config";

/* -- Database Connection -- */

/* -- SSL Config -- */
const sslConfig =
  // If the environment is production and the dialect is postgres, use the ssl config
  process.env.NODE_ENV === "production" && config.DB_DIALECT === "postgres"
    ? {
        require: true,
        rejectUnauthorized: false,
      }
    : false;

/* -- Create Sequelize instance -- */
const sequelize = new Sequelize(
  // Get database name, user, password
  config.DB_NAME,
  config.DB_USER,
  config.DB_PASS,
  {
    // Get host, dialect, port
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

/* -- Connect to the database -- */
export const connectDB = async () => {
  try {
    // Authenticate the connection
    await sequelize.authenticate();
    console.log(`Connected to ${config.DB_DIALECT} database via Sequelize`);
    return true;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return false;
  }
};

export default sequelize;
