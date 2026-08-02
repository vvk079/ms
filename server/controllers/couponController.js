// controllers/couponController.js
// Public: validate/apply a coupon against a subtotal. Admin: full CRUD.
import asyncHandler from '../middleware/asyncHandler.js';
import Coupon from '../models/Coupon.js';

// @route  POST /api/coupons/apply   body: { code, subtotal }
export const applyCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal = 0 } = req.body;
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase() });
  if (!coupon) {
    res.status(404);
    throw new Error('Invalid coupon code');
  }
  const check = coupon.isValidFor(subtotal);
  if (!check.ok) {
    res.status(400);
    throw new Error(check.reason);
  }
  const discount = coupon.discountFor(subtotal);
  res.json({
    code: coupon.code,
    description: coupon.description,
    discount,
    newTotal: subtotal - discount,
  });
});

// ── ADMIN ────────────────────────────────────────────────────
export const getCoupons = asyncHandler(async (req, res) => {
  res.json(await Coupon.find().sort({ createdAt: -1 }));
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json(coupon);
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  res.json(coupon);
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  res.json({ message: 'Coupon removed' });
});
