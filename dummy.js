const mysql = require("mysql2/promise");
const config = require("./config/db");

async function testConnection() {
  try {
    const connection = await mysql.createConnection(config);
    console.log("✅ Database connection successful!");
    await connection.end();
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
}

testConnection();
