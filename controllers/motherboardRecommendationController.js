import db from "../config/db.js";

export const getMotherboardRecommendations = async (req, res) => {
  const { cpuId, ramType, budget, strict } = req.body;

  console.log("📥 Received /api/recommend/motherboard payload:", {
    cpuId,
    ramType,
    budget,
    strict,
  });

  if (!cpuId || isNaN(cpuId) || !budget || isNaN(budget)) {
    console.warn("❌ Invalid input:", { cpuId, ramType, budget });
    return res.status(400).json({ error: "Invalid CPU ID or budget" });
  }

  try {
    const [cpuRows] = await db.query("SELECT * FROM cpu WHERE id = ?", [cpuId]);
    if (!cpuRows.length) {
      console.warn("❌ CPU not found for ID:", cpuId);
      return res.status(404).json({ error: "CPU not found" });
    }
    const cpu = cpuRows[0];

    const [moboRows] = await db.query("SELECT * FROM motherboard WHERE price <= ?", [budget]);

    const recommendations = moboRows
      .map((mb) => {
        const tags = [];

        if (mb.cpu_socket === cpu.socket) tags.push("Socket Match");

        if (!ramType || mb.ram_type === ramType) {
          tags.push(`Supports ${mb.ram_type}`);
        }

        if (parseFloat(mb.pcie_version) >= 4.0) {
          tags.push("PCIe 4.0+ Ready");
        }

        if (mb.storage_slots?.includes("M.2")) {
          tags.push("Supports NVMe SSD");
        }

        if (mb.storage_slots?.includes("SATA")) {
          tags.push("SATA Ready");
        }

        if (strict) {
          if (!tags.includes("Socket Match") || !tags.some((t) => t.includes("Supports"))) {
            return null;
          }
        }

        return {
          id: mb.id,
          name: mb.name,
          chipset: mb.chipset,
          ram_type: mb.ram_type,
          max_ram_capacity: mb.max_ram_capacity,
          pcie_version: mb.pcie_version,
          price: mb.price,
          image: mb.image || "https://via.placeholder.com/200",
          tags,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.max_ram_capacity - a.max_ram_capacity)
      .slice(0, 3);

    console.log(`✅ Sending ${recommendations.length} Motherboard recommendations`);
    return res.json({ recommendations });
  } catch (err) {
    console.error("🔥 Internal server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
