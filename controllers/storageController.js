import db from "../config/db.js";


export const getAllStorage = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM storage ORDER BY price ASC");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching storage devices:", err);
    res.status(500).json({ error: "Failed to fetch storage devices" });
  }
};


export const getStorageById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM storage WHERE storage_id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Storage device not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error fetching storage by ID:", err);
    res.status(500).json({ error: "Failed to fetch storage device" });
  }
};

export const createStorage = async (req, res) => {
  const { name, type, capacity, interface_type, form_factor, price, image_url } = req.body;

  if (!name || !type || !capacity || !interface_type || !form_factor || !price) {
    return res.status(400).json({ error: "All required fields must be provided" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO storage (name, type, capacity, interface_type, form_factor, price, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, type, capacity, interface_type, form_factor, price, image_url || null]
    );

    res.status(201).json({ message: "Storage device created successfully", storage_id: result.insertId });
  } catch (err) {
    console.error("❌ Error creating storage device:", err);
    res.status(500).json({ error: "Failed to create storage device" });
  }
};

export const updateStorage = async (req, res) => {
  const { id } = req.params;
  const { name, type, capacity, interface_type, form_factor, price, image_url } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE storage
       SET name = ?, type = ?, capacity = ?, interface_type = ?, form_factor = ?, price = ?, image_url = ?
       WHERE storage_id = ?`,
      [name, type, capacity, interface_type, form_factor, price, image_url || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Storage device not found" });
    }

    res.json({ message: "Storage device updated successfully" });
  } catch (err) {
    console.error("❌ Error updating storage device:", err);
    res.status(500).json({ error: "Failed to update storage device" });
  }
};

export const deleteStorage = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM storage WHERE storage_id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Storage device not found" });
    }

    res.json({ message: "Storage device deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting storage device:", err);
    res.status(500).json({ error: "Failed to delete storage device" });
  }
};
