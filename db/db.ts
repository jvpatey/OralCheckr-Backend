import mysql from "mysql2";
import config from "./config.ts";

const connectDB = async () => {
  const pool = mysql.createPool(config);

  pool.getConnection((err, connection) => {
    if (err) {
      console.error({ error: err.message });
      return;
    }

    console.log("Connected to MySQL database");
    connection.release();
  });
};

export default connectDB;
