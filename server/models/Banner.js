// models/Banner.js
// Home-page hero / promo banners managed from the admin panel.
import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    ctaText: { type: String, default: 'SHOP NOW' },
    link: { type: String, default: '/shop' },
    image: { type: String, default: '' },      // ImageKit URL
    imageId: { type: String, default: '' },
    tint: { type: String, default: '#c9bfae' }, // fallback panel colour from the design
    position: { type: String, enum: ['hero', 'promo'], default: 'hero' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Banner = mongoose.model('Banner', bannerSchema);
export default Banner;
