const { Pool } = require("pg");
require("dotenv").config();

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
    console.error(error.message);
  }
}

testDatabase();

module.exports = pool;