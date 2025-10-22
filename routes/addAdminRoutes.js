import express from "express";
import { sendAddAdminOTP, verifyAddAdminOTP } from "../controllers/addAdminController.js";

const router = express.Router();

router.post("/send-otp", sendAddAdminOTP);
router.post("/verify-otp", verifyAddAdminOTP);

export default router;
