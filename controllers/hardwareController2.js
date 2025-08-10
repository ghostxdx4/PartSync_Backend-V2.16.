import pool from '../config/db.js';

export const getHardware = async (req, res) => {
  const { type } = req.params;
  try {
    const [rows] = await pool.query(`SELECT * FROM ??`, [type]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addHardware = async (req, res) => {
  const { type } = req.params;
  try {
    await pool.query(`INSERT INTO ?? SET ?`, [type, req.body]);
    res.json({ success: true, message: `${type} added` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
