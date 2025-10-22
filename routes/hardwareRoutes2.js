import express from "express";
import multer from "multer";
import { addHardware, getHardware } from "../controllers/hardwareController2.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/add/:type", upload.single("image"), addHardware);
router.get("/get/:type", getHardware);

export default router;
