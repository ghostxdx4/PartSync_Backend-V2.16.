import express from 'express';
import axios from 'axios';
import pool from "../config/db.js";
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many AI requests, please wait.' },
});
router.use(aiLimiter);

function summarizeRows(rows, keys, maxItems = 8) {
  return rows.slice(0, maxItems).map(r =>
    keys.map(k => `${k}:${r[k] ?? ''}`).join('|')
  ).join('\n');
}

function validateInput(purpose, budget) {
  if (!purpose || typeof purpose !== 'string') return 'Invalid purpose';
  const b = Number(budget);
  if (Number.isNaN(b) || b <= 0) return 'Invalid budget';
  return null;
}

function extractJSON(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

router.post('/', async (req, res) => {
  try {
    const { purpose, budget, customPrompt } = req.body;
    const validationErr = validateInput(purpose, budget);
    if (validationErr) return res.status(400).json({ error: validationErr });

    const safeCustomPrompt = typeof customPrompt === 'string' ? customPrompt.trim().slice(0, 100) : '';

    const [cpus] = await pool.query('SELECT id, name, brand, socket, tdp, ram_type, performance_score, image_url FROM cpu ORDER BY performance_score DESC LIMIT 50');
    const [gpus] = await pool.query('SELECT id, name, brand, vram, tdp, pcie_version, performance_score, price, length_mm, image_url FROM gpu ORDER BY performance_score DESC LIMIT 100');
    const [psus] = await pool.query('SELECT id, name, wattage, efficiency_rating, modularity, connector_6_pin, connector_8_pin, connector_12_pin, price FROM psu ORDER BY wattage DESC LIMIT 50');
    const [mobos] = await pool.query('SELECT id, name, brand, chipset, cpu_socket, ram_type, pcie_version, form_factor, price FROM motherboard LIMIT 50');
    const [rams]  = await pool.query('SELECT id, name, type, speed, capacity, modules, price FROM ram LIMIT 50');
    const [storages] = await pool.query('SELECT id, name, brand, type, capacity, read_speed, write_speed, interface, price FROM storage LIMIT 20');

    const promptParts = [
      `You are a helpful PC build assistant. A user wants a ${purpose} PC with a budget of ${budget}.`,
      safeCustomPrompt ? `User preferences: ${safeCustomPrompt}` : '',
      `You must propose a single *complete* build: CPU, GPU, Motherboard, RAM, PSU, Storage (optional), Case (optional), Cooling (optional).`,
      `Constraints:`,
      `- Total estimated price must be <= budget.`,
      `- CPU and motherboard socket must match.`,
      `- Motherboard RAM type must match RAM type.`,
      `- PSU wattage must be sufficient for GPU TDP + CPU TDP + 150W headroom.`,
      `- Ignore anything unrelated to PC components.`,
      `- If multiple options tie, prefer higher performance_score then lower price.`,
      `Use only parts from the lists below.`,
      ``,
      `CPUs (id|name|socket|tdp|ram_type|performance_score|price):\n${summarizeRows(cpus, ['id','name','socket','tdp','ram_type','performance_score','price'], 12)}`,
      ``,
      `GPUs (id|name|vram|tdp|pcie_version|performance_score|price|length_mm):\n${summarizeRows(gpus, ['id','name','vram','tdp','pcie_version','performance_score','price','length_mm'], 20)}`,
      ``,
      `PSUs (id|name|wattage|connector_8_pin|price):\n${summarizeRows(psus, ['id','name','wattage','connector_8_pin','price'], 12)}`,
      ``,
      `Motherboards (id|name|cpu_socket|ram_type|pcie_version|price):\n${summarizeRows(mobos, ['id','name','cpu_socket','ram_type','pcie_version','price'], 12)}`,
      ``,
      `RAM (id|name|type|speed|capacity|modules|price):\n${summarizeRows(rams, ['id','name','type','speed','capacity','modules','price'], 8)}`,
      ``,
      `Storage (id|name|type|capacity|price):\n${summarizeRows(storages, ['id','name','type','capacity','price'], 8)}`,
      ``,
      `RESPONSE_FORMAT: Return ONLY a valid JSON object with keys:`,
      `{
  "build": {
    "CPU": {"id": <id>, "name": "<name>", "price": <price>},
    "GPU": {"id": <id>, "name": "<name>", "price": <price>},
    "Motherboard": {...},
    "RAM": {...},
    "PSU": {...},
    "Storage": {...} (optional),
    "Case": {...} (optional),
    "Cooling": {...} (optional),
    "EstimatedTotal": <number>
  },
  "reasoning": "<short explanation under 120 words>"
}`,
      `Important: If budget is too low and no parts fit, return build:null and a helpful explanation in reasoning.`,
    ].filter(Boolean);

    const prompt = promptParts.join('\n');

    const GROQ_API_URL = process.env.GROQ_API_URL;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_URL || !GROQ_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    const groqResponse = await axios.post(
      `${GROQ_API_URL}/chat/completions`,
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );

    const rawText = groqResponse.data?.choices?.[0]?.message?.content || '';
    const jsonOut = extractJSON(rawText);

    if (!jsonOut) {
      return res.status(500).json({
        build: null,
        reasoning: "AI returned a non-JSON response",
        raw: rawText
      });
    }

    const build = jsonOut.build || null;
    if (build) {
      function lookupPrice(table, id) {
        const arrMap = { cpu: cpus, gpu: gpus, psu: psus, motherboard: mobos, ram: rams, storage: storages };
        const rows = arrMap[table];
        if (!rows) return null;
        const found = rows.find(r => Number(r.id) === Number(id));
        return found ? Number(found.price || 0) : null;
      }

      let sum = 0;
      const tables = { CPU: 'cpu', GPU: 'gpu', Motherboard: 'motherboard', RAM: 'ram', PSU: 'psu', Storage: 'storage' };
      for (const key of Object.keys(tables)) {
        const item = build[key];
        if (item && item.id) {
          const p = lookupPrice(tables[key], item.id);
          if (p !== null) sum += p;
        } else if (item && item.price) sum += Number(item.price);
      }

      if (!build.EstimatedTotal) build.EstimatedTotal = sum;
      jsonOut.build = build;
    }

    return res.json(jsonOut);

  } catch (err) {
    console.error('AI recommend error:', err?.response?.data || err.message || err);
    return res.status(500).json({ error: 'Internal AI recommendation error' });
  }
});

export default router;
