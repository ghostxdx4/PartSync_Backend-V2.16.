import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import { generateOTP, verifyOTP } from "../utils/otpStore.js";
import { sendEmail } from "../utils/sendEmail.js";
import { logAction } from "../middleware/auditMiddleware.js";

const otpAttempts = {}; 

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query("SELECT * FROM admin WHERE email = ?", [email]);
    if (!rows.length) return res.status(400).json({ success: false, message: "Admin not found" });

    const admin = rows[0];

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid password" });

    if (admin.is_blacklisted) {
      const now = new Date();
      const until = new Date(admin.blacklisted_until);
      if (now < until) {
        return res.status(403).json({
          success: false,
          message: `Account is locked until ${until.toLocaleString()}`,
        });
      } else {
        await pool.query(
          "UPDATE admin SET is_blacklisted = 0, blacklisted_until = NULL WHERE email = ?",
          [email]
        );
        otpAttempts[email] = 0;
      }
    }

    const otp = generateOTP(email);
    await sendEmail(email, "PartSync Admin OTP", `Your OTP is: ${otp}`);

    return res.json({ success: true, message: "OTP sent to email." });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

export const verifyOTPLogin = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const [rows] = await pool.query("SELECT * FROM admin WHERE email = ?", [email]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Admin not found" });

    const admin = rows[0];

    // Check if account is blacklisted
    if (admin.is_blacklisted) {
      const now = new Date();
      const until = new Date(admin.blacklisted_until);
      if (now < until) {
        return res.status(403).json({
          success: false,
          message: `Account is locked until ${until.toLocaleString()}`,
          attemptsLeft: 0,
        });
      } else {
        await pool.query(
          "UPDATE admin SET is_blacklisted = 0, blacklisted_until = NULL WHERE email = ?",
          [email]
        );
        otpAttempts[email] = 0;
      }
    }

    if (!otpAttempts[email]) otpAttempts[email] = 0;

    if (!verifyOTP(email, otp)) {
      otpAttempts[email] += 1;

      if (otpAttempts[email] >= 3) {
        const until = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await pool.query(
          "UPDATE admin SET is_blacklisted = 1, blacklisted_until = ? WHERE email = ?",
          [until, email]
        );
        otpAttempts[email] = 0;
        return res.status(403).json({
          success: false,
          message: "Too many wrong OTP attempts. Account locked for 24 hours.",
          attemptsLeft: 0,
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        attemptsLeft: 3 - otpAttempts[email],
      });
    }

    otpAttempts[email] = 0;

    const token = Buffer.from(`${email}:${Date.now()}`).toString("base64");

    await logAction(admin.id, "LOGIN", "admin", admin.id);

    return res.json({ success: true, token });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ success: false, message: "Server error. Try again." });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM audit_logs ORDER BY created_at DESC");
    return res.json(rows);
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    return res.status(500).json({ message: "Error fetching logs." });
  }
};
