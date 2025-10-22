import express from 'express';
import {
  getCPUs,
  getPSUs,
  getMotherboards,
  getRecommendations,
  getGpu,
  getRAM
} from '../controllers/hardwareController.js';

const router = express.Router();

router.get('/cpu', getCPUs);
router.get('/psu', getPSUs);
router.get('/motherboard', getMotherboards);
router.get('/gpu', getGpu)
router.get('/ram', getRAM)
router.post('/recommendations', getRecommendations);


export default router;
