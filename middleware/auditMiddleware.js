import pool from "../config/db.js";

export const logAction = async (
  adminId,
  action,
  targetTable,
  targetId,
  details = null,
  ip = null
) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs 
      (admin_id, action, target_table, target_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [adminId, action, targetTable, targetId, details, ip]
    );
    console.log(`✅ Audit log recorded: Admin ${adminId} performed ${action}`);
  } catch (err) {
    console.error("🚨 Failed to log audit action:", err.message);
  }
};
