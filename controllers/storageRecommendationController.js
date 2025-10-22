import db from "../config/db.js";

export const getStorageRecommendations = async (req, res) => {
  const { moboId, budget, strict } = req.body;

  console.log("📥 Received /api/recommend/storage payload:", {
    moboId,
    budget,
    strict,
  });

  if (!moboId || isNaN(moboId) || !budget || isNaN(budget)) {
    console.warn("❌ Bad input received:", { moboId, budget });
    return res
      .status(400)
      .json({ error: "Invalid Motherboard ID or Budget provided" });
  }

  try {
    const [moboRows] = await db.query("SELECT * FROM motherboard WHERE id = ?", [
      moboId,
    ]);
    if (!moboRows.length) {
      console.warn("❌ Motherboard not found for ID:", moboId);
      return res.status(400).json({ error: "Motherboard not found" });
    }
    const mobo = moboRows[0];

    const supportedInterfaces = [];
    if (mobo.storage_slots?.includes("SATA")) supportedInterfaces.push("SATA SSD", "HDD");
    if (mobo.storage_slots?.includes("M.2")) supportedInterfaces.push("NVMe SSD");

    const [storageRows] = await db.query("SELECT * FROM storage WHERE price <= ?", [
      budget,
    ]);

    const recommendations = storageRows
      .map((storage) => {
        const tags = [];

        if (
          (storage.type === "NVMe SSD" && supportedInterfaces.includes("NVMe SSD")) ||
          (storage.type === "SATA SSD" && supportedInterfaces.includes("SATA SSD")) ||
          (storage.type === "HDD" && supportedInterfaces.includes("HDD"))
        ) {
          tags.push("Interface Compatible");
        }

        if (storage.type === "NVMe SSD") {
          tags.push("Ultra-Fast NVMe");
        } else if (storage.type === "SATA SSD") {
          tags.push("Reliable SSD");
        } else if (storage.type === "HDD") {
          tags.push("High Capacity HDD");
        }

        if (storage.capacity >= 2000) {
          tags.push("Large Storage");
        } else if (storage.capacity >= 1000) {
          tags.push("1TB+ Recommended");
        } else {
          tags.push("Entry Capacity");
        }

        if (strict && !tags.includes("Interface Compatible")) {
          return null;
        }

        return {
          name: storage.name,
          type: storage.type, 
          capacity: storage.capacity,
          speed: storage.speed,
          price: storage.price,
          image: storage.image_url || "https://via.placeholder.com/200",
          tags,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const typeRank = { "NVMe SSD": 3, "SATA SSD": 2, HDD: 1 };
        if (typeRank[b.type] !== typeRank[a.type]) {
          return typeRank[b.type] - typeRank[a.type];
        }
        return b.capacity - a.capacity;
      })
      .slice(0, 3);

    console.log(`✅ Sending ${recommendations.length} Storage recommendations`);
    return res.json({ recommendations });
  } catch (err) {
    console.error("🔥 Internal server error (Storage Recommend):", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
