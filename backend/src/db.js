// backend/src/db.js - Database Connection
const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:123qweasdzxc@localhost:5432/nutritrack",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
});

// Test database connection
pool.on("connect", (client) => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err, client) => {
  console.error("❌ Database connection error:", err);
  process.exit(-1);
});

// Database query wrapper with error handling
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("📊 Query executed:", {
      text: text.substring(0, 50) + "...",
      duration,
      rows: res.rowCount,
    });
    return res;
  } catch (error) {
    console.error("❌ Database query error:", {
      text,
      params,
      error: error.message,
    });
    throw error;
  }
};

// Helper function to begin transaction
const beginTransaction = async () => {
  const client = await pool.connect();
  await client.query("BEGIN");
  return client;
};

// Helper function to commit transaction
const commitTransaction = async (client) => {
  await client.query("COMMIT");
  client.release();
};

// Helper function to rollback transaction
const rollbackTransaction = async (client) => {
  await client.query("ROLLBACK");
  client.release();
};

// Test connection on startup
const testConnection = async () => {
  try {
    const res = await query("SELECT NOW() as current_time");
    console.log(
      "🔌 Database connection test successful:",
      res.rows[0].current_time
    );
  } catch (error) {
    console.error("❌ Database connection test failed:", error.message);
    process.exit(-1);
  }
};

// Initialize connection test
testConnection();

module.exports = {
  query,
  pool,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
};
