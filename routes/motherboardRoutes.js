import express from "express";
import {
  getAllMotherboards,
  getMotherboardById,
  createMotherboard,
  updateMotherboard,
  deleteMotherboard,
} from "../controllers/motherboardController.js";

const router = express.Router();

router.get("/", getAllMotherboards);
router.get("/:id", getMotherboardById);
router.post("/", createMotherboard);
router.put("/:id", updateMotherboard);
router.delete("/:id", deleteMotherboard);

export default router;
