// controllers/reviewController.js
// Customers can review products they've purchased. The Review model's hooks keep
// the product's rating aggregates in sync automatically.
import asyncHandler from '../middleware/asyncHandler.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';

// @route  GET /api/reviews/:productId
export const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 });
  res.json(reviews);
});

// @route  POST /api/reviews/:productId   body: { rating, title, comment }
export const createReview = asyncHandler(async (req, res) => {
  const { rating, title = '', comment } = req.body;
  const productId = req.params.productId;

  // Verified-buyer check: has this user ordered the product?
  const hasBought = await Order.exists({
    user: req.user._id,
    'items.product': productId,
  });

  const already = await Review.findOne({ product: productId, user: req.user._id });
  if (already) {
    res.status(409);
    throw new Error('You have already reviewed this product');
  }

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    title,
    comment,
    verified: Boolean(hasBought),
  });
  res.status(201).json(review);
});

// @route  DELETE /api/reviews/:id   (owner or admin)
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  if (String(review.user) !== String(req.user._id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorised');
  }
  await review.deleteOne(); // note: use findByIdAndDelete path for hook; see below
  await Review.recalcProduct(review.product);
  res.json({ message: 'Review removed' });
});
