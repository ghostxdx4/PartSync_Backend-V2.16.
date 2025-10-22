import express from "express";
import {
  getAllStorage,
  getStorageById,
  createStorage,
  updateStorage,
  deleteStorage,
} from "../controllers/storageController.js";

const router = express.Router();

router.get("/", getAllStorage);
router.get("/:id", getStorageById);
router.post("/", createStorage);
router.put("/:id", updateStorage);
router.delete("/:id", deleteStorage);

export default router;
