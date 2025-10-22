import express from "express";
import { getAllRAMs, getRAMById, createRAM, updateRAM, deleteRAM } from "../controllers/ramController.js";

const router = express.Router();

router.get("/", getAllRAMs);
router.get("/:id", getRAMById);
router.post("/", createRAM);
router.put("/:id", updateRAM);
router.delete("/:id", deleteRAM);

export default router;
