const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/cpu', async (req, res) => {
  const [rows] = await db.query('SELECT id, name, brand, cores, tdp FROM cpu');
  res.json(rows);
});

router.get('/psu', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM psu');
  res.json(rows);
});

router.get('/motherboard', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM motherboard');
  res.json(rows);
});

module.exports = router;
