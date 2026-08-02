// models/Coupon.js
// Discount codes. Supports percentage or flat amount, min-cart threshold,
// max cap, usage limits and validity window. Includes a helper to compute
// the discount for a given subtotal.
import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
    value: { type: Number, required: true, min: 0 },   // 10 (=10%) or 200 (=₹200)
    minCart: { type: Number, default: 0 },             // min subtotal to qualify
    maxDiscount: { type: Number, default: 0 },         // cap for percent coupons (0 = none)
    usageLimit: { type: Number, default: 0 },          // total redemptions (0 = unlimited)
    perUserLimit: { type: Number, default: 1 },        // redemptions per customer (0 = unlimited)
    usedCount: { type: Number, default: 0 },
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Validity check for a given subtotal.
couponSchema.methods.isValidFor = function (subtotal) {
  const now = Date.now();
  if (!this.isActive) return { ok: false, reason: 'Coupon is inactive' };
  if (this.startsAt && now < this.startsAt.getTime()) return { ok: false, reason: 'Coupon not yet active' };
  if (this.expiresAt && now > this.expiresAt.getTime()) return { ok: false, reason: 'Coupon has expired' };
  if (this.usageLimit && this.usedCount >= this.usageLimit) return { ok: false, reason: 'Coupon usage limit reached' };
  if (subtotal < this.minCart) return { ok: false, reason: `Minimum cart of ₹${this.minCart} required` };
  return { ok: true };
};

// Discount amount for a subtotal (assumes isValidFor already passed).
couponSchema.methods.discountFor = function (subtotal) {
  let d = this.type === 'percent' ? (subtotal * this.value) / 100 : this.value;
  if (this.type === 'percent' && this.maxDiscount) d = Math.min(d, this.maxDiscount);
  return Math.min(Math.round(d), subtotal);
};

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
