// routes/cartRoutes.js — all cart routes require auth (server-side cart).
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getCart, addToCart, updateCartItem, removeCartItem, clearCart, mergeCart,
} from '../controllers/cartController.js';

const router = express.Router();
router.use(protect);

router.get('/', getCart);
router.post('/', addToCart);
router.post('/merge', mergeCart);
router.put('/:lineId', updateCartItem);
router.delete('/:lineId', removeCartItem);
router.delete('/', clearCart);

export default router;
