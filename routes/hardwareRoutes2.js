import express from 'express';
import { getHardware, addHardware } from '../controllers/hardwareController2.js';

const router = express.Router();

router.get('/get/:type', getHardware);
router.post('/add/:type', addHardware);

export default router;
