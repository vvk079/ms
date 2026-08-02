// routes/adminRoutes.js — every route here is admin-guarded.
import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getDashboard, getAllOrders, updateOrderStatus, getCustomers, getSalesReport,
} from '../controllers/adminController.js';

const router = express.Router();
router.use(protect, admin);

router.get('/dashboard', getDashboard);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/customers', getCustomers);
router.get('/sales-report', getSalesReport);

export default router;
