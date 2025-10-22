import express from "express";
import {
  adminLogin,
  verifyOTPLogin,
  getAuditLogs,
} from "../controllers/adminController.js";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/verify-otp", verifyOTPLogin);
router.get("/audit", getAuditLogs);

export default router;
