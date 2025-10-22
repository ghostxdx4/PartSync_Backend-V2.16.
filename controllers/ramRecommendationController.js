import db from "../config/db.js";

export const getRamRecommendations = async (req, res) => {
  let { moboId, budget, strict } = req.body;

  console.log("📥 Received /api/recommend/ram payload:", {
    moboId,
    budget,
    strict,
  });

  strict = strict === true || strict === "true";

  if (!moboId || isNaN(Number(moboId)) || !budget || isNaN(Number(budget))) {
    console.warn("❌ Bad input received:", { moboId, budget });
    return res
      .status(400)
      .json({ error: "Invalid Motherboard ID or Budget provided" });
  }

  try {
    const [moboRows] = await db.query(
      "SELECT * FROM motherboard WHERE id = ?",
      [moboId]
    );
    if (!moboRows.length) {
      console.warn("❌ Motherboard not found for ID:", moboId);
      return res.status(400).json({ error: "Motherboard not found" });
    }
    const mobo = moboRows[0];
    const moboRamType = mobo.ram_type || "DDR4";
    const moboMaxRam = mobo.max_ram || 128;
    const moboRamSlots = mobo.ram_slots || 4;

    const [ramRows] = await db.query("SELECT * FROM ram WHERE price <= ?", [
      budget,
    ]);

    const recommendations = ramRows
      .map((ram) => {
        const tags = [];

        let ramModulesCount = 1;
        if (ram.modules && typeof ram.modules === "string") {
          const match = ram.modules.match(/^(\d+)x/i);
          if (match) ramModulesCount = Number(match[1]);
        }

        if (ram.ram_type === moboRamType) tags.push("RAM Type Compatible");
        if (ram.capacity <= moboMaxRam) tags.push("Within Max Capacity");
        if (ramModulesCount <= moboRamSlots) tags.push("Fits Slots");

        if (ram.speed >= 3600) tags.push("High-Speed RAM");
        else if (ram.speed >= 3000) tags.push("Balanced Performance");
        else tags.push("Entry-Level");

        if (strict) {
          if (
            !tags.includes("RAM Type Compatible") ||
            !tags.includes("Within Max Capacity") ||
            !tags.includes("Fits Slots")
          ) {
            return null;
          }
        }

        return {
          name: ram.name,
          capacity: ram.capacity,
          modules: ram.modules,
          speed: ram.speed,
          type: ram.ram_type,
          price: ram.price,
          image: ram.image || "https://via.placeholder.com/200",
          tags,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.speed - a.speed)
      .slice(0, 3);

    console.log(`✅ Sending ${recommendations.length} RAM recommendations`);
    return res.json({ recommendations });
  } catch (err) {
    console.error("🔥 Internal server error (RAM Recommend):", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
