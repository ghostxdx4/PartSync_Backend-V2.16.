import db from "../config/db.js";

export const getAllMotherboards = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM motherboards ORDER BY price ASC");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching motherboards:", err);
    res.status(500).json({ error: "Failed to fetch motherboards" });
  }
};


export const getMotherboardById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM motherboards WHERE mobo_id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Motherboard not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error fetching motherboard by ID:", err);
    res.status(500).json({ error: "Failed to fetch motherboard" });
  }
};

export const createMotherboard = async (req, res) => {
  const { name, chipset, socket, ram_type, max_ram, slots, price, image_url } = req.body;

  if (!name || !chipset || !socket || !ram_type || !max_ram || !slots || !price) {
    return res.status(400).json({ error: "All required fields must be provided" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO motherboards (name, chipset, socket, ram_type, max_ram, slots, price, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, chipset, socket, ram_type, max_ram, slots, price, image_url || null]
    );

    res.status(201).json({ message: "Motherboard created successfully", mobo_id: result.insertId });
  } catch (err) {
    console.error("❌ Error creating motherboard:", err);
    res.status(500).json({ error: "Failed to create motherboard" });
  }
};

export const updateMotherboard = async (req, res) => {
  const { id } = req.params;
  const { name, chipset, socket, ram_type, max_ram, slots, price, image_url } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE motherboards 
       SET name = ?, chipset = ?, socket = ?, ram_type = ?, max_ram = ?, slots = ?, price = ?, image_url = ?
       WHERE mobo_id = ?`,
      [name, chipset, socket, ram_type, max_ram, slots, price, image_url || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Motherboard not found" });
    }

    res.json({ message: "Motherboard updated successfully" });
  } catch (err) {
    console.error("❌ Error updating motherboard:", err);
    res.status(500).json({ error: "Failed to update motherboard" });
  }
};

export const deleteMotherboard = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM motherboards WHERE mobo_id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Motherboard not found" });
    }

    res.json({ message: "Motherboard deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting motherboard:", err);
    res.status(500).json({ error: "Failed to delete motherboard" });
  }
};
