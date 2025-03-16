import { DataTypes } from "sequelize";
import config from "./config";

// Helper function to get the appropriate INTEGER type based on dialect
export const getIntegerType = (unsigned = false) => {
  if (config.DB_DIALECT === "postgres") {
    // PostgreSQL doesn't support UNSIGNED, return INTEGER
    return DataTypes.INTEGER;
  } else {
    return unsigned ? DataTypes.INTEGER.UNSIGNED : DataTypes.INTEGER;
  }
};

export const STRING = DataTypes.STRING;
export const BOOLEAN = DataTypes.BOOLEAN;
export const DATE = DataTypes.DATE;
export const TEXT = DataTypes.TEXT;
export const FLOAT = DataTypes.FLOAT;
