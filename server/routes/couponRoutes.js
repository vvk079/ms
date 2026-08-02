// routes/couponRoutes.js
import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  applyCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon,
} from '../controllers/couponController.js';

const router = express.Router();

// Public (used at cart/checkout)
router.post('/apply', applyCoupon);

// Admin
router.get('/', protect, admin, getCoupons);
router.post('/', protect, admin, createCoupon);
router.put('/:id', protect, admin, updateCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

export default router;
