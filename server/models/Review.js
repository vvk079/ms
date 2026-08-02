// models/Review.js
// One review per user per product. A post-save/remove hook recomputes the
// product's rating + numReviews so the PDP always shows accurate aggregates.
import mongoose from 'mongoose';
import Product from './Product.js';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },      // snapshot of reviewer name
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: '' },
    comment: { type: String, required: true },
    verified: { type: Boolean, default: true },  // "Verified Buyer" badge in the design
  },
  { timestamps: true }
);

// A user may review a given product only once.
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Recompute a product's aggregate rating from all its reviews.
reviewSchema.statics.recalcProduct = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = stats[0] || {};
  await Product.findByIdAndUpdate(productId, {
    rating: Math.round(avg * 10) / 10,
    numReviews: count,
  });
};

reviewSchema.post('save', function () {
  this.constructor.recalcProduct(this.product);
});
// findOneAndDelete / findByIdAndDelete
reviewSchema.post('findOneAndDelete', function (doc) {
  if (doc) doc.constructor.recalcProduct(doc.product);
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
