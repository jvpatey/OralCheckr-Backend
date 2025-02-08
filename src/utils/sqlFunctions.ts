import mysql from "mysql2";
import config from "../db/config.ts";
import type { User } from "../controllers/authControllers.ts";

const pool = mysql.createPool(config);

// Create table in database
export const createTable = (schema: string) => {
  return new Promise((resolve, reject) => {
    pool.query(schema, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Check if record exists in database
export const checkRecordExists = (
  tableName: string,
  column: string,
  value: any
) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ${tableName} WHERE ${column} = ?`;
    pool.query(query, [value], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(Array.isArray(results) && results.length ? results[0] : null);
      }
    });
  });
};

// Insert record into database
export const insertRecord = (tableName: string, record: User) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO ${tableName} SET ?`;
    pool.query(query, [record], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};
