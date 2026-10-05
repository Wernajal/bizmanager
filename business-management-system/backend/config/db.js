const { Pool } = require("pg");

// Only load local .env during local development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is missing ❌");
}

const pool = new Pool({
  connectionString: databaseUrl,

  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,

  connectionTimeoutMillis: 10000,
});

async function testDatabase() {
  try {
    const result = await pool.query("SELECT NOW()");

    console.log("PostgreSQL connected ✅");
    console.log("Database time:", result.rows[0].now);
  } catch (error) {
    console.error("Database connection failed ❌");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code || "No error code");
    console.error("Error detail:", error.detail || "No detail");
    console.error("Error hint:", error.hint || "No hint");
  }
}

testDatabase();

module.exports = pool;