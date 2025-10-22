import pool from '../config/db.js';
import { generateRecommendations } from '../utils/recommendationEngine.js';

export const getCPUs = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, brand, cores, tdp FROM cpu ORDER BY performance_score DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch CPUs' });
  }
};

export const getPSUs = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM psu');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch PSUs' });
  }
};

export const getMotherboards = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM motherboard');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch motherboards' });
  }
};

export const getGpu = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM gpu');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch gpu' });
  }
};

export const getRAM = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM ram');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch ram' });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const { cpuId, psuId, moboId, budget, strictBudget } = req.body;

    const [[cpuRows], [psuRows], [moboRows]] = await Promise.all([
      pool.query('SELECT * FROM cpu WHERE id = ?', [cpuId]),
      pool.query('SELECT * FROM psu WHERE id = ?', [psuId]),
      pool.query('SELECT * FROM motherboard WHERE id = ?', [moboId]),
    ]);

    if (!cpuRows.length || !psuRows.length || !moboRows.length) {
      return res.status(400).json({ error: 'Invalid CPU, PSU, or Motherboard ID' });
    }

    const cpu = cpuRows[0];
    const psu = psuRows[0];
    const motherboard = moboRows[0];

    const psuConnectors = [];
    if (psu.connector_6_pin > 0) psuConnectors.push('6-pin');
    if (psu.connector_8_pin > 0) psuConnectors.push('8-pin');
    if (psu.connector_12_pin > 0) psuConnectors.push('12-pin');

    const recommendations = await generateRecommendations({
      cpuId: cpu.id,
      psuWattage: psu.wattage,
      psuConnectors,
      motherboardPcie: motherboard.pcie_version,
      budget,
      strictBudget,
    });

    res.json({ recommendations });
  } catch (err) {
    console.error('Recommendation Error:', err);
    res.status(500).json({ error: 'Recommendation failed' });
  }
};
