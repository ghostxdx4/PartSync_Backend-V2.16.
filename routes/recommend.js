import express from "express";
import { getGpuRecommendations } from "../controllers/gpuRecommendationController.js";
import { getRamRecommendations } from "../controllers/ramRecommendationController.js";
import { getStorageRecommendations } from "../controllers/storageRecommendationController.js";
import { getMotherboardRecommendations } from "../controllers/motherboardRecommendationController.js";

const router = express.Router();

router.post("/gpu", getGpuRecommendations);
router.post("/ram", getRamRecommendations);
router.post("/storage", getStorageRecommendations);
router.post("/motherboard", getMotherboardRecommendations);

export default router;
