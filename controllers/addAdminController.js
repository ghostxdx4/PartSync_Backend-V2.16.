import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/sendEmail.js";
import pool from "../config/db.js";

const pendingAdmins = {};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendAddAdminOTP = async (req, res) => {
  try {
    const { creatorEmail, email: newAdminEmail, password: newAdminPassword } = req.body;

    if (!creatorEmail || !newAdminEmail || !newAdminPassword) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const [exists] = await pool.query("SELECT id FROM admin WHERE email = ?", [newAdminEmail]);
    if (exists.length > 0) {
      return res.status(400).json({ message: "Admin already exists." });
    }

    const otp = generateOTP();

    pendingAdmins[creatorEmail] = {
      otp,
      newAdminData: { email: newAdminEmail, password: newAdminPassword, role: "admin" },
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    await sendEmail(
      creatorEmail,
      "Verify Add Admin OTP",
      `You are adding a new admin: ${newAdminEmail}\nOTP: ${otp}\nThis OTP expires in 5 minutes.`
    );

    console.log(`📧 OTP sent to ${creatorEmail}: ${otp}`);
    res.json({ message: "OTP sent to your email for verification." });
  } catch (err) {
    console.error("Error sending AddAdmin OTP:", err);
    res.status(500).json({ message: "Failed to send OTP." });
  }
};

export const verifyAddAdminOTP = async (req, res) => {
  try {
    const { creatorEmail, otp } = req.body;

    if (!creatorEmail || !otp) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const pending = pendingAdmins[creatorEmail];
    if (!pending) return res.status(400).json({ message: "No pending admin addition found." });

    if (Date.now() > pending.expiresAt) {
      delete pendingAdmins[creatorEmail];
      return res.status(400).json({ message: "OTP expired." });
    }

    if (pending.otp !== otp) return res.status(400).json({ message: "Invalid OTP." });

    const { email: newAdminEmail, password: newAdminPassword, role } = pending.newAdminData;

    const hashedPassword = await bcrypt.hash(newAdminPassword, 10);

    await pool.query(
      "INSERT INTO admin (email, password_hash, role) VALUES (?, ?, ?)",
      [newAdminEmail, hashedPassword, role]
    );

    console.log(`✅ Admin ${newAdminEmail} added by ${creatorEmail}`);

    delete pendingAdmins[creatorEmail];

    res.json({ message: `Admin ${newAdminEmail} added successfully.` });
  } catch (err) {
    console.error("Error verifying AddAdmin OTP:", err);
    res.status(500).json({ message: "Failed to verify OTP." });
  }
};
