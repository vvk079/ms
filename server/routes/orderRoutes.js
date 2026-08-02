// routes/orderRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createOrder, getMyOrders, getOrder, trackOrder, cancelOrder,
} from '../controllers/orderController.js';

const router = express.Router();

// Public order tracking by order number.
router.get('/track/:orderNumber', trackOrder);

// Authenticated
router.post('/', protect, createOrder);
router.get('/mine', protect, getMyOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);

export default router;
