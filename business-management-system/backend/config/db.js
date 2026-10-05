const { Pool } = require("pg");

// Only load local .env during local development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" 
    ? { rejectUnauthorized: false } 
    : false
});

async function testDatabase() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("PostgreSQL connected ✅");
    console.log("Database time:", result.rows[0].now);
  } catch (error) {
    console.error("Database connection failed ❌");
    console.error("Error Details:", error.message);
    if (error.code) {
      console.error("Error Code:", error.code);
    }
  }
}

testDatabase();

module.exports = pool;