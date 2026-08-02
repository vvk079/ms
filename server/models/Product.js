// models/Product.js
// The core catalogue document. Mirrors the exact fields requested in the brief
// (name, slug, sizes, colors, images, stock, material, SKU, flags, rating…).
import mongoose from 'mongoose';
import slugify from '../utils/slugify.js';

// Each colour option carries its own hex + label + optional images/stock.
const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },   // e.g. "Sky Blue"
    hex: { type: String, required: true },     // e.g. "#bcd0e6"
  },
  { _id: false }
);

// Per-size inventory so we can track stock at the variant level.
const sizeStockSchema = new mongoose.Schema(
  {
    size: { type: String, required: true },    // XS, S, M, L, XL, XXL
    stock: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    fileId: { type: String, default: '' },     // ImageKit id for deletion
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, default: '' },
    brand: { type: String, default: 'RICHBAYY' },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subCategory: { type: String, default: '' },
    gender: { type: String, enum: ['Men', 'Women', 'Unisex'], default: 'Men' },

    // Pricing in INR (whole rupees). discountPrice ≤ price when present.
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    discountPrice: { type: Number, default: 0, min: 0 },

    sizes: [sizeStockSchema],
    colors: [colorSchema],
    images: [imageSchema],
    tint: { type: String, default: '#ddd6cb' }, // fallback swatch bg from the design

    // Aggregate stock kept in sync from sizes for quick "in stock?" checks.
    stock: { type: Number, default: 0, min: 0 },
    material: { type: String, default: '' },
    fit: { type: String, default: 'Relaxed Tailored Fit' },
    care: { type: String, default: '' },
    SKU: { type: String, unique: true, sparse: true },

    // Denormalised review aggregates (recomputed when a review is added/removed).
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },

    // Merchandising flags used across the storefront.
    featured: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
    bestSeller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // Simple analytics
    soldCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Full-text index for the storefront search bar.
productSchema.index({ name: 'text', description: 'text', brand: 'text', subCategory: 'text' });

// Keep slug + aggregate stock in sync before validation/save.
productSchema.pre('validate', function (next) {
  if (this.isModified('name') || !this.slug) {
    // Append a short suffix to keep slugs unique even for same-named products.
    const base = slugify(this.name);
    this.slug = this.isNew ? `${base}-${Date.now().toString(36).slice(-4)}` : this.slug || base;
  }
  if (this.isModified('sizes') && this.sizes?.length) {
    this.stock = this.sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
  }
  next();
});

// Virtual: effective selling price (discount if valid, else price).
productSchema.virtual('effectivePrice').get(function () {
  return this.discountPrice && this.discountPrice < this.price ? this.discountPrice : this.price;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
