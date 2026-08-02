// routes/bannerRoutes.js
import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getBanners, getAllBanners, createBanner, updateBanner, deleteBanner,
} from '../controllers/bannerController.js';

const router = express.Router();

router.get('/', getBanners);

router.get('/all', protect, admin, getAllBanners);
router.post('/', protect, admin, createBanner);
router.put('/:id', protect, admin, updateBanner);
router.delete('/:id', protect, admin, deleteBanner);

export default router;
