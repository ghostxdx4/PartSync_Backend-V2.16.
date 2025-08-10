import express from 'express';
import {
  getCPUs,
  getPSUs,
  getMotherboards,
  getRecommendations
} from '../controllers/hardwareController.js';

const router = express.Router();

router.get('/cpu', getCPUs);
router.get('/psu', getPSUs);
router.get('/motherboard', getMotherboards);
router.post('/recommendations', getRecommendations);

export default router;
