const { Pool } = require("pg");
require("dotenv").config();

// Initialize the PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" 
    ? { rejectUnauthorized: false } 
    : false
});

// Test the database connection and log detailed error information
async function testDatabase() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("PostgreSQL connected ✅");
    console.log("Database time:", result.rows[0].now);
  } catch (error) {
    console.error("Database connection failed ❌");
    console.error("Full Error Details:", error);
  }
}

testDatabase();

module.exports = pool;