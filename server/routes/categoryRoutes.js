// routes/categoryRoutes.js
import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getCategories, getCategory, createCategory, updateCategory, deleteCategory,
} from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', getCategories);
router.get('/:slug', getCategory);

router.post('/', protect, admin, createCategory);
router.put('/:id', protect, admin, updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

export default router;
