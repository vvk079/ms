// controllers/categoryController.js
// Public listing + admin CRUD for categories.
import asyncHandler from '../middleware/asyncHandler.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { deleteFromImageKit } from '../config/imagekit.js';

// @route  GET /api/categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 });

  // Attach a live product count so the UI can show "24 items" etc.
  const withCounts = await Promise.all(
    categories.map(async (c) => ({
      ...c.toObject(),
      productCount: await Product.countDocuments({ category: c._id, isActive: true }),
    }))
  );
  res.json(withCounts);
});

// @route  GET /api/categories/:slug
export const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json(category);
});

// ── ADMIN ────────────────────────────────────────────────────
export const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  Object.assign(category, req.body);
  await category.save();
  res.json(category);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  const inUse = await Product.countDocuments({ category: category._id });
  if (inUse > 0) {
    res.status(409);
    throw new Error(`Cannot delete — ${inUse} product(s) still use this category`);
  }
  await deleteFromImageKit(category.imageId);
  await category.deleteOne();
  res.json({ message: 'Category removed' });
});
