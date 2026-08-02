// routes/productRoutes.js
import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getProducts, getFacets, getProduct, getRelated,
  createProduct, updateProduct, deleteProduct,
} from '../controllers/productController.js';

const router = express.Router();

// Public
router.get('/', getProducts);
router.get('/facets', getFacets);
router.get('/:id/related', getRelated);
router.get('/:slug', getProduct);

// Admin
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

export default router;
