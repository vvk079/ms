// controllers/cartController.js
// Server-side cart persisted on the user document. Each line is keyed by
// product + size + color so variants stay distinct. Prices are re-read from the
// product on every fetch so the cart can never show stale pricing.
import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

const MAX_QTY_PER_LINE = 20;
// Coerce any client-supplied quantity to a positive integer within [1, MAX].
// Guards against negative/NaN/huge values that would corrupt totals & inventory.
const safeQty = (v) => Math.min(MAX_QTY_PER_LINE, Math.max(1, Math.floor(Number(v)) || 1));

// Build a normalised, priced cart response from the raw user.cart lines.
const hydrateCart = async (user) => {
  const productIds = user.cart.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds } })
    .select('name price discountPrice images tint stock sizes slug')
    .lean({ virtuals: true });
  const map = new Map(products.map((p) => [String(p._id), p]));

  const items = user.cart
    .map((line) => {
      const p = map.get(String(line.product));
      if (!p) return null; // product deleted — drop the line
      const price = p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price;
      const sizeStock = p.sizes?.find((s) => s.size === line.size)?.stock ?? p.stock;
      return {
        _id: line._id,
        product: p._id,
        slug: p.slug,
        name: p.name,
        image: p.images?.[0]?.url || '',
        tint: p.tint,
        price,
        size: line.size,
        color: line.color,
        qty: line.qty,
        lineTotal: price * line.qty,
        inStock: sizeStock > 0,
      };
    })
    .filter(Boolean);

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);
  return { items, subtotal, count };
};

// @route  GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(await hydrateCart(user));
});

// @route  POST /api/cart   body: { productId, size, color, qty }
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, size, color = '', qty = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (!size) {
    res.status(400);
    throw new Error('Please select a size');
  }

  const user = await User.findById(req.user._id);
  const existing = user.cart.find(
    (i) => String(i.product) === productId && i.size === size && i.color === color
  );

  const addQty = safeQty(qty);
  if (existing) existing.qty = safeQty(existing.qty + addQty);
  else user.cart.push({ product: productId, name: product.name, price: product.effectivePrice, image: product.images?.[0]?.url, size, color, qty: addQty });

  await user.save();
  res.status(201).json(await hydrateCart(user));
});

// @route  PUT /api/cart/:lineId   body: { qty }
export const updateCartItem = asyncHandler(async (req, res) => {
  const { qty } = req.body;
  const user = await User.findById(req.user._id);
  const line = user.cart.id(req.params.lineId);
  if (!line) {
    res.status(404);
    throw new Error('Cart item not found');
  }
  line.qty = safeQty(qty);
  await user.save();
  res.json(await hydrateCart(user));
});

// @route  DELETE /api/cart/:lineId
export const removeCartItem = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.cart = user.cart.filter((i) => String(i._id) !== req.params.lineId);
  await user.save();
  res.json(await hydrateCart(user));
});

// @route  DELETE /api/cart
export const clearCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.cart = [];
  await user.save();
  res.json(await hydrateCart(user));
});

// @route  POST /api/cart/merge   body: { items:[{productId,size,color,qty}] }
// Merges a guest cart (kept in localStorage) into the account on login.
export const mergeCart = asyncHandler(async (req, res) => {
  const { items = [] } = req.body;
  const user = await User.findById(req.user._id);

  for (const g of items) {
    const product = await Product.findById(g.productId);
    if (!product) continue;
    const existing = user.cart.find(
      (i) => String(i.product) === g.productId && i.size === g.size && i.color === (g.color || '')
    );
    if (!g.size) continue; // size is required for a valid line
    const gQty = safeQty(g.qty);
    if (existing) existing.qty = safeQty(existing.qty + gQty);
    else user.cart.push({ product: g.productId, name: product.name, price: product.effectivePrice, image: product.images?.[0]?.url, size: g.size, color: g.color || '', qty: gQty });
  }
  await user.save();
  res.json(await hydrateCart(user));
});
