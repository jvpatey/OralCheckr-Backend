import { Sequelize } from "sequelize";
import config from "./config";
import { getSequelizeConfig } from "./sequelizeConfig";
import { getSSLConfig } from "./sslConfig";

/* -- Database Connection -- */

/* -- SSL Config -- */
const sslConfig = getSSLConfig(config.DB_DIALECT);

/* -- Create Sequelize instance -- */
const sequelize = new Sequelize(
  config.DB_NAME,
  config.DB_USER,
  config.DB_PASS,
  getSequelizeConfig()
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
