import pool from "../config/db.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { logAction } from "../middleware/auditMiddleware.js";
import fs from "fs";

export const addHardware = async (req, res) => {
  try {
    const { type } = req.params;
    const admin_email = req.headers["x-admin-email"];
    let { ...data } = req.body;

    if (req.file) {
      const imageUrl = await uploadToCloudinary(req.file.path, type);
      fs.unlinkSync(req.file.path);
      data.image_url = imageUrl;
    }

    const columns = Object.keys(data).join(",");
    const placeholders = Object.keys(data).map(() => "?").join(",");
    const values = Object.values(data);

    const [result] = await pool.query(
      `INSERT INTO ${type} (${columns}) VALUES (${placeholders})`,
      values
    );

    await logAction(admin_email, "ADD", type, result.insertId);
    res.status(201).json({ message: `${type} added successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding hardware." });
  }
};

export const getHardware = async (req, res) => {
  try {
    const { type } = req.params;
    const [rows] = await pool.query(`SELECT * FROM ${type}`);
    res.json(rows);
  } catch {
    res.status(500).json({ message: "Error fetching data." });
  }
};
