import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import hardwareRoutes from './routes/hardwareRoutes.js';
import recommendRoute from './routes/recommend.js';
import adminRoutes from './routes/adminRoutes.js';
import hardwareRoutes2 from './routes/hardwareRoutes2.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/hardware', hardwareRoutes);
app.use('/api/recommend', recommendRoute);

app.use('/api/admin', adminRoutes);
app.use('/admin', hardwareRoutes2); 

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
