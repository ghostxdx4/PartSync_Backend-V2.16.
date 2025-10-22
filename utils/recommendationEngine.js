import pool from "../config/db.js";

export async function generateRecommendations({ cpuId, psuId, moboId, budget, strictBudget }) {
  const [cpuRows] = await pool.query("SELECT * FROM cpu WHERE id = ?", [cpuId]);
  if (!cpuRows.length) throw new Error("CPU not found");
  const cpu = cpuRows[0];

  const [psuRows] = await pool.query("SELECT * FROM psu WHERE id = ?", [psuId]);
  if (!psuRows.length) throw new Error("PSU not found");
  const psu = psuRows[0];

  const [moboRows] = await pool.query("SELECT * FROM motherboard WHERE id = ?", [moboId]);
  if (!moboRows.length) throw new Error("Motherboard not found");
  const mobo = moboRows[0];

  const results = {
    gpu: [],
    ram: [],
    storage: [],
  };

  const [gpus] = await pool.query("SELECT * FROM gpu");

  const compatibleGpus = gpus.filter((gpu) => {
    const tdpRoom = psu.wattage - cpu.tdp;

    const connectorOk =
      (gpu.tdp <= 150 && psu.connector_6_pin > 0) ||
      (gpu.tdp > 150 && gpu.tdp <= 250 && psu.connector_8_pin > 0) ||
      (gpu.tdp > 250 && psu.connector_12_pin > 0);

    const pcieOk =
      parseFloat(gpu.pcie_version) <= parseFloat(mobo.pcie_version);

    const budgetOk = strictBudget
      ? gpu.price <= budget
      : gpu.price <= budget * 1.1;

    return gpu.tdp <= tdpRoom && connectorOk && pcieOk && budgetOk;
  });

  const gpuScored = compatibleGpus.map((gpu) => {
    const tags = [];
    if (gpu.tdp <= psu.wattage - cpu.tdp) tags.push("Fits PSU");
    if (parseFloat(gpu.pcie_version) <= parseFloat(mobo.pcie_version)) tags.push("PCIe OK");
    if (gpu.performance_score / cpu.performance_score <= 1.5) tags.push("No Bottleneck");

    return { ...gpu, tags };
  });

  const sortedByValue = [...gpuScored].sort(
    (a, b) => b.performance_score / b.price - a.performance_score / a.price
  );

  results.gpu = [
    sortedByValue[0] || null,
    [...gpuScored].sort((a, b) => b.performance_score - a.performance_score)[0] || null,
    [...gpuScored].sort((a, b) => a.price - b.price)[0] || null,
  ];


const [mobos] = await pool.query("SELECT * FROM motherboard WHERE price <= ?", [budget]);

const compatibleMobos = mobos
  .filter((mb) => {
    const socketOk = mb.cpu_socket === cpu.socket;
    const ramOk = mb.ram_type === "DDR4" || mb.ram_type === "DDR5"; 
    const budgetOk = strictBudget ? mb.price <= budget : mb.price <= budget * 1.1;
    return socketOk && ramOk && budgetOk;
  })
  .map((mb) => {
    const tags = [];
    if (mb.cpu_socket === cpu.socket) tags.push("Socket Match");
    if (mb.ram_type === cpu.ram_type || mb.ram_type === "DDR5") tags.push("Future-Proof RAM");
    if (parseFloat(mb.pcie_version) >= 4.0) tags.push("PCIe 4.0+ Ready");
    if (mb.storage_slots.includes("M.2")) tags.push("Supports NVMe");
    return { ...mb, tags };
  })
  .sort((a, b) => b.max_ram_capacity - a.max_ram_capacity)
  .slice(0, 3);

results.motherboard = compatibleMobos;


  const [ramModules] = await pool.query("SELECT * FROM ram WHERE price <= ?", [budget]);

  const compatibleRam = ramModules
    .filter((ram) => ram.type === mobo.ram_type)
    .map((ram) => {
      const tags = [];
      if (ram.type === mobo.ram_type) tags.push("Type Match");
      if (ram.speed >= mobo.max_ram_speed) tags.push("High-Speed Compatible");
      if (ram.capacity >= 16) tags.push("Good for Gaming/Workstation");
      return { ...ram, tags };
    })
    .sort((a, b) => b.capacity - a.capacity)
    .slice(0, 3);

  results.ram = compatibleRam;

  const [storageOptions] = await pool.query("SELECT * FROM storage WHERE price <= ?", [budget]);

  const supportedInterfaces = [];
  if (mobo.storage_slots?.includes("SATA")) supportedInterfaces.push("SATA SSD", "HDD");
  if (mobo.storage_slots?.includes("M.2")) supportedInterfaces.push("NVMe SSD");

  const compatibleStorage = storageOptions
    .filter((storage) => supportedInterfaces.includes(storage.type))
    .map((storage) => {
      const tags = ["Interface Compatible"];
      if (storage.type === "NVMe SSD") tags.push("Ultra-Fast NVMe");
      if (storage.type === "SATA SSD") tags.push("Reliable SSD");
      if (storage.type === "HDD") tags.push("High Capacity HDD");
      if (storage.capacity >= 2000) tags.push("Large Storage");
      return { ...storage, tags };
    })
    .sort((a, b) => {
      const rank = { "NVMe SSD": 3, "SATA SSD": 2, HDD: 1 };
      if (rank[b.type] !== rank[a.type]) return rank[b.type] - rank[a.type];
      return b.capacity - a.capacity;
    })
    .slice(0, 3);

  results.storage = compatibleStorage;

  return { recommendations: results };
}
