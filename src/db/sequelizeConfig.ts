import { Dialect } from "sequelize";
import config from "./config";
import { getSSLConfig } from "./sslConfig";

/* -- Sequelize Configuration -- */

export const getSequelizeConfig = () => ({
  host: config.DB_HOST,
  dialect: config.DB_DIALECT as Dialect,
  port: parseInt(config.DB_PORT, 10),
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: getSSLConfig(config.DB_DIALECT),
  },
});
