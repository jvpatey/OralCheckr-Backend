import { DataTypes } from "sequelize";
import config from "./config";

/* -- Database Type Compatibility Layer -- */

export const getIntegerType = (unsigned = false) => {
  if (config.DB_DIALECT === "postgres") {
    // PostgreSQL doesn't support UNSIGNED, return plain INTEGER
    return DataTypes.INTEGER;
  } else {
    // For MySQL and other dialects that support UNSIGNED
    return unsigned ? DataTypes.INTEGER.UNSIGNED : DataTypes.INTEGER;
  }
};

// Export common data types for consistency across models
export const STRING = DataTypes.STRING;
export const BOOLEAN = DataTypes.BOOLEAN;
export const DATE = DataTypes.DATE;
export const TEXT = DataTypes.TEXT;
export const FLOAT = DataTypes.FLOAT;
