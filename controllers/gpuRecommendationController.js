import db from "../config/db.js";

export const getGpuRecommendations = async (req, res) => {
  const { cpuId, psuId, moboId, budget, strict } = req.body;

  console.log("📥 Received /api/recommend/gpu payload:", {
    cpuId,
    psuId,
    moboId,
    budget,
    strict,
  });

  if (
    !cpuId ||
    isNaN(cpuId) ||
    !psuId ||
    isNaN(psuId) ||
    !moboId ||
    isNaN(moboId) ||
    !budget ||
    isNaN(budget)
  ) {
    console.warn("❌ Bad input received:", { cpuId, psuId, moboId, budget });
    return res.status(400).json({ error: "Invalid CPU, PSU, or Motherboard ID" });
  }

  try {
    const [cpuRows] = await db.query("SELECT * FROM cpu WHERE id = ?", [cpuId]);
    if (!cpuRows.length) {
      console.warn("❌ CPU not found for ID:", cpuId);
      return res.status(400).json({ error: "CPU not found" });
    }
    const cpu = cpuRows[0];
    const cpuScore = cpu.performance_score;

    const [psuRows] = await db.query("SELECT * FROM psu WHERE id = ?", [psuId]);
    if (!psuRows.length) {
      console.warn("❌ PSU not found for ID:", psuId);
      return res.status(400).json({ error: "PSU not found" });
    }
    const psu = psuRows[0];
    const psuWattage = psu.wattage;

    const connectors = [];
    if (psu.connector_6_pin > 0) connectors.push("6");
    if (psu.connector_8_pin > 0) connectors.push("8");
    if (psu.connector_12_pin > 0) connectors.push("12");

    const [moboRows] = await db.query("SELECT * FROM motherboard WHERE id = ?", [
      moboId,
    ]);
    if (!moboRows.length) {
      console.warn("❌ Motherboard not found for ID:", moboId);
      return res.status(400).json({ error: "Motherboard not found" });
    }
    const mobo = moboRows[0];
    const moboPcieVersion = mobo.pcie_version;

    const [gpuRows] = await db.query("SELECT * FROM gpu WHERE price <= ?", [
      budget,
    ]);

    const recommendations = gpuRows
      .map((gpu) => {
        const tags = [];

        if (gpu.performance_score < cpuScore * 1.5) tags.push("No Bottleneck");

        if (parseFloat(gpu.pcie_version) <= parseFloat(moboPcieVersion))
          tags.push("PCIe Compatible");

        const hasRequiredConnector =
          (gpu.tdp <= 150 && connectors.includes("6")) ||
          (gpu.tdp > 150 && gpu.tdp <= 250 && connectors.includes("8")) ||
          (gpu.tdp > 250 && connectors.includes("12"));

        if (gpu.tdp < psuWattage - 100 && hasRequiredConnector) {
          tags.push("PSU OK");
        }

        if (strict) {
          if (
            !tags.includes("No Bottleneck") ||
            !tags.includes("PCIe Compatible") ||
            !tags.includes("PSU OK")
          ) {
            return null;
          }
        }

        return {
          name: gpu.name,
          vram: gpu.vram,
          tdp: gpu.tdp,
          score: gpu.performance_score,
          price: gpu.price,
          image: gpu.image_url || "https://via.placeholder.com/200",
          tags,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    console.log(`✅ Sending ${recommendations.length} GPU recommendations`);
    return res.json({ recommendations });
  } catch (err) {
    console.error("🔥 Internal server error (GPU Recommend):", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
