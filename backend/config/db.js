const { Pool } = require("pg");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const isProduction = process.env.NODE_ENV === "production";
const databaseUrl = process.env.DATABASE_URL;

const connectionConfig = databaseUrl
  ? { connectionString: databaseUrl }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

const requiredLocalSettings = [
  "DB_HOST",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
];

if (!databaseUrl && requiredLocalSettings.some((key) => !process.env[key])) {
  throw new Error(
    "Database configuration is missing. Set DATABASE_URL or DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD."
  );
}

const pool = new Pool({
  ...connectionConfig,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
});

async function testDatabase() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("PostgreSQL connected");
    console.log("Database time:", result.rows[0].now);
  } catch (error) {
    console.error("Database connection failed");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code || "No error code");
    console.error("Error detail:", error.detail || "No detail");
    console.error("Error hint:", error.hint || "No hint");
  }
}

testDatabase();

module.exports = pool;
