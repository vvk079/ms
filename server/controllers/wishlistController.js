// controllers/wishlistController.js
// Wishlist is a simple array of product refs on the user document.
import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/User.js';

// @route  GET /api/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'wishlist',
    select: 'name slug price discountPrice images tint rating numReviews colors',
  });
  res.json(user.wishlist);
});

// @route  POST /api/wishlist/:productId  — toggle add/remove
export const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const user = await User.findById(req.user._id);

  const idx = user.wishlist.findIndex((p) => String(p) === productId);
  let added;
  if (idx > -1) {
    user.wishlist.splice(idx, 1);
    added = false;
  } else {
    user.wishlist.push(productId);
    added = true;
  }
  await user.save();
  res.json({ added, wishlist: user.wishlist });
});

// @route  DELETE /api/wishlist/:productId
export const removeWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.wishlist = user.wishlist.filter((p) => String(p) !== req.params.productId);
  await user.save();
  res.json({ wishlist: user.wishlist });
});
