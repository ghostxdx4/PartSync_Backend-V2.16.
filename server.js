import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import hardwareRoutes from './routes/hardwareRoutes.js';
import ramRoutes from "./routes/ramRoutes.js";
import motherboardRoutes from "./routes/motherboardRoutes.js";
import storageRoutes from "./routes/storageRoutes.js";
import recommendRoute from './routes/recommend.js';
import hardwareRoutes2 from "./routes/hardwareRoutes2.js";
import adminRoutes from "./routes/adminRoutes.js";
import aiRecommendRoute from "./routes/aiRecommend.js";
import addAdminRoutes from "./routes/addAdminRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/hardware', hardwareRoutes);
app.use('/api/recommend', recommendRoute);
app.use("/api/hardware/ram", ramRoutes);
app.use("/api/hardware/motherboard", motherboardRoutes);
app.use("/api/hardware/storage", storageRoutes);

app.use("/admin", adminRoutes);
app.use("/admin", hardwareRoutes2);
app.use("/add-admin", addAdminRoutes);

app.use("/api/ai-recommend", aiRecommendRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
