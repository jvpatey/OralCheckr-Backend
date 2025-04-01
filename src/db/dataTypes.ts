import { DataTypes } from "sequelize";
import config from "./config";

/* -- Data Types -- */
// For postgres - use the integer type
// MySQL supports UNSIGNED - use the integer type with the UNSIGNED flag

// Get the integer type
export const getIntegerType = (unsigned = false) => {
  if (config.DB_DIALECT === "postgres") {
    return DataTypes.INTEGER;
  } else {
    return unsigned ? DataTypes.INTEGER.UNSIGNED : DataTypes.INTEGER;
  }
};

// Export common data types for consistency across models
export const STRING = DataTypes.STRING;
export const BOOLEAN = DataTypes.BOOLEAN;
export const DATE = DataTypes.DATE;
export const TEXT = DataTypes.TEXT;
export const FLOAT = DataTypes.FLOAT;
