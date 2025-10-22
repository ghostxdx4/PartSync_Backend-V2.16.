import db from "../config/db.js";

export const getAllRAMs = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM rams ORDER BY price ASC");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching RAMs:", err);
    res.status(500).json({ error: "Failed to fetch RAM modules" });
  }
};

export const getRAMById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM rams WHERE ram_id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "RAM not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error fetching RAM by ID:", err);
    res.status(500).json({ error: "Failed to fetch RAM" });
  }
};

export const createRAM = async (req, res) => {
  const { name, type, speed, capacity, modules, price, image_url } = req.body;

  if (!name || !type || !speed || !capacity || !modules || !price) {
    return res.status(400).json({ error: "All required fields must be provided" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO rams (name, type, speed, capacity, modules, price, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, type, speed, capacity, modules, price, image_url || null]
    );

    res.status(201).json({ message: "RAM created successfully", ram_id: result.insertId });
  } catch (err) {
    console.error("❌ Error creating RAM:", err);
    res.status(500).json({ error: "Failed to create RAM" });
  }
};

export const updateRAM = async (req, res) => {
  const { id } = req.params;
  const { name, type, speed, capacity, modules, price, image_url } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE rams 
       SET name = ?, type = ?, speed = ?, capacity = ?, modules = ?, price = ?, image_url = ?
       WHERE ram_id = ?`,
      [name, type, speed, capacity, modules, price, image_url || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "RAM not found" });
    }

    res.json({ message: "RAM updated successfully" });
  } catch (err) {
    console.error("❌ Error updating RAM:", err);
    res.status(500).json({ error: "Failed to update RAM" });
  }
};

export const deleteRAM = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM rams WHERE ram_id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "RAM not found" });
    }

    res.json({ message: "RAM deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting RAM:", err);
    res.status(500).json({ error: "Failed to delete RAM" });
  }
};
