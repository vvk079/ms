// controllers/productController.js
// Public catalogue reads (list/filter/search/sort/paginate, single, related,
// facets) plus admin create/update/delete. Image handling is delegated to the
// upload controller / ImageKit helper; here we accept already-uploaded URLs.
import asyncHandler from '../middleware/asyncHandler.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import { deleteFromImageKit } from '../config/imagekit.js';
import escapeRegex from '../utils/escapeRegex.js';

// @route  GET /api/products
// Query params: keyword, category(slug), gender, color, size, minPrice, maxPrice,
//               sort, page, limit, featured, newArrival, bestSeller
export const getProducts = asyncHandler(async (req, res) => {
  const {
    keyword, category, gender, color, size,
    minPrice, maxPrice, sort, featured, newArrival, bestSeller,
  } = req.query;

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(48, parseInt(req.query.limit) || 12);

  const filter = { isActive: true };

  if (keyword) filter.$text = { $search: keyword };
  if (gender) filter.gender = gender;
  if (color) filter['colors.name'] = { $regex: new RegExp(escapeRegex(color), 'i') };
  if (size) filter['sizes.size'] = size.toUpperCase();
  if (featured === 'true') filter.featured = true;
  if (newArrival === 'true') filter.newArrival = true;
  if (bestSeller === 'true') filter.bestSeller = true;

  // Category is passed as a slug — resolve to an id.
  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (cat) filter.category = cat._id;
    else return res.json({ products: [], page: 1, pages: 0, total: 0 });
  }

  // Price filter uses the effective price. Since discountPrice may be 0, we match
  // on `price` for a simple, index-friendly range (good enough for the storefront).
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // Sorting options.
  const sortMap = {
    newest: { createdAt: -1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    rating: { rating: -1 },
    popular: { soldCount: -1 },
  };
  const sortBy = sortMap[sort] || sortMap.newest;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean({ virtuals: true }),
    Product.countDocuments(filter),
  ]);

  res.json({ products, page, pages: Math.ceil(total / limit), total });
});

// @route  GET /api/products/facets
// Returns distinct colours/sizes + price range to build the shop filter sidebar.
export const getFacets = asyncHandler(async (req, res) => {
  const [colors, sizes, priceRange] = await Promise.all([
    Product.distinct('colors.name', { isActive: true }),
    Product.distinct('sizes.size', { isActive: true }),
    Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
    ]),
  ]);
  res.json({
    colors: colors.sort(),
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'].filter((s) => sizes.includes(s)),
    priceRange: priceRange[0] ? { min: priceRange[0].min, max: priceRange[0].max } : { min: 0, max: 5000 },
  });
});

// @route  GET /api/products/:slug
// Accepts a slug (preferred) or an ObjectId. Increments view count.
export const getProduct = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const query = slug.match(/^[0-9a-fA-F]{24}$/) ? { _id: slug } : { slug };

  const product = await Product.findOneAndUpdate(query, { $inc: { viewCount: 1 } }, { new: true })
    .populate('category', 'name slug');

  if (!product || !product.isActive) {
    res.status(404);
    throw new Error('Product not found');
  }

  const reviews = await Review.find({ product: product._id })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ product, reviews });
});

// @route  GET /api/products/:id/related
export const getRelated = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  const related = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    isActive: true,
  })
    .limit(6)
    .lean({ virtuals: true });
  res.json(related);
});

// ── ADMIN ────────────────────────────────────────────────────

// @route  POST /api/products   (admin)
export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

// @route  PUT /api/products/:id   (admin)
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  Object.assign(product, req.body);
  await product.save(); // triggers slug/stock hooks
  res.json(product);
});

// @route  DELETE /api/products/:id   (admin)
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  // Clean up CDN assets, then remove reviews + the product.
  await Promise.all((product.images || []).map((img) => deleteFromImageKit(img.fileId)));
  await Review.deleteMany({ product: product._id });
  await product.deleteOne();
  res.json({ message: 'Product removed' });
});
