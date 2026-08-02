// controllers/bannerController.js
// Public read of active banners + admin CRUD.
import asyncHandler from '../middleware/asyncHandler.js';
import Banner from '../models/Banner.js';
import { deleteFromImageKit } from '../config/imagekit.js';

// @route  GET /api/banners
export const getBanners = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.position) filter.position = req.query.position;
  res.json(await Banner.find(filter).sort({ order: 1 }));
});

// ── ADMIN ────────────────────────────────────────────────────
export const getAllBanners = asyncHandler(async (req, res) => {
  res.json(await Banner.find().sort({ order: 1 }));
});

export const createBanner = asyncHandler(async (req, res) => {
  res.status(201).json(await Banner.create(req.body));
});

export const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!banner) {
    res.status(404);
    throw new Error('Banner not found');
  }
  res.json(banner);
});

export const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) {
    res.status(404);
    throw new Error('Banner not found');
  }
  await deleteFromImageKit(banner.imageId);
  await banner.deleteOne();
  res.json({ message: 'Banner removed' });
});
