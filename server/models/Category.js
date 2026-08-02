// models/Category.js
// Product categories (e.g. Solid Shirts, Linen Shirts). Supports an optional
// parent for two-level nesting and carries a display image/tint.
import mongoose from 'mongoose';
import slugify from '../utils/slugify.js';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },        // ImageKit URL
    imageId: { type: String, default: '' },       // ImageKit fileId for cleanup
    tint: { type: String, default: '#cabfae' },   // fallback tile background from the design
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },          // manual sort order
  },
  { timestamps: true }
);

// Auto-generate a URL slug from the name.
categorySchema.pre('validate', function (next) {
  if (this.isModified('name') || !this.slug) this.slug = slugify(this.name);
  next();
});

const Category = mongoose.model('Category', categorySchema);
export default Category;
