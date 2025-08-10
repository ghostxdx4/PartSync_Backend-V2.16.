import pool from '../config/db.js';

export async function generateRecommendations({ cpuId, psuId, moboId, budget, strictBudget }) {
  const [cpuRows] = await pool.query('SELECT * FROM cpu WHERE id = ?', [cpuId]);
  if (cpuRows.length === 0) throw new Error('CPU not found');
  const cpu = cpuRows[0];

  const [psuRows] = await pool.query('SELECT * FROM psu WHERE id = ?', [psuId]);
  if (psuRows.length === 0) throw new Error('PSU not found');
  const psu = psuRows[0];

  const [moboRows] = await pool.query('SELECT * FROM motherboard WHERE id = ?', [moboId]);
  if (moboRows.length === 0) throw new Error('Motherboard not found');
  const mobo = moboRows[0];

  const [gpus] = await pool.query('SELECT * FROM gpu');

  const compatibleGpus = gpus.filter(gpu => {
    const tdpRoom = psu.wattage - cpu.tdp;

    const connectorOk = (
      (gpu.tdp <= 150 && psu.connector_6_pin > 0) ||
      (gpu.tdp > 150 && gpu.tdp <= 250 && psu.connector_8_pin > 0) ||
      (gpu.tdp > 250 && psu.connector_12_pin > 0)
    );

    const pcieOk = parseFloat(gpu.pcie_version) <= parseFloat(mobo.pcie_version);

    const budgetOk = strictBudget
      ? gpu.price <= budget
      : gpu.price <= budget * 1.1;

    return gpu.tdp <= tdpRoom && connectorOk && pcieOk && budgetOk;
  });

  const scored = compatibleGpus.map(gpu => {
    const tags = [];

    if (gpu.tdp <= psu.wattage - cpu.tdp) tags.push('Fits PSU');
    if (parseFloat(gpu.pcie_version) <= parseFloat(mobo.pcie_version)) tags.push('PCIe OK');

    const bottleneckRatio = gpu.performance_score / cpu.performance_score;
    if (bottleneckRatio <= 1.5) tags.push('No Bottleneck');

    return { ...gpu, tags };
  });

  const sortedByValue = [...scored].sort((a, b) =>
    (b.performance_score / b.price) - (a.performance_score / a.price)
  );

  return {
    recommendations: [
      sortedByValue[0] || null, // Best Value
      [...scored].sort((a, b) => b.performance_score - a.performance_score)[0] || null, // High-End
      [...scored].sort((a, b) => a.price - b.price)[0] || null // Budget
    ]
  };
}
