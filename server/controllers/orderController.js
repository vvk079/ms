// controllers/orderController.js
// Places orders from the server-side cart (authoritative pricing), decrements
// stock, applies coupons, and exposes order history + tracking. Payment is
// COD-ready with an ONLINE hook left in place for a gateway (Razorpay/Stripe).
import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Coupon from '../models/Coupon.js';
import normalizePhone from '../utils/normalizePhone.js';

const FREE_SHIP_THRESHOLD = 1499;
const SHIP_FEE = 99;
const GST_RATE = 0.05; // 5% — prices are tax-inclusive; this is the info component
const MAX_QTY_PER_LINE = 20; // sane per-variant cap to bound abuse

// Return a reserved item's stock to inventory (used to roll back a failed order).
const restockItem = (it) =>
  it.hasVariant
    ? Product.updateOne(
        { _id: it.product, 'sizes.size': it.size },
        { $inc: { 'sizes.$.stock': it.qty, stock: it.qty, soldCount: -it.qty } }
      )
    : Product.updateOne({ _id: it.product }, { $inc: { stock: it.qty, soldCount: -it.qty } });

// @route  POST /api/orders   body: { addressId | shippingAddress, paymentMethod, couponCode }
export const createOrder = asyncHandler(async (req, res) => {
  const { addressId, shippingAddress, paymentMethod = 'COD', couponCode = '' } = req.body;

  // Only COD is fulfilled today. ONLINE must be gated behind a verified gateway
  // payment — never commit an order (and decrement stock) for unpaid ONLINE.
  if (paymentMethod === 'ONLINE' && process.env.PAYMENTS_ENABLED !== 'true') {
    res.status(400);
    throw new Error('Online payment is not available yet. Please choose Cash on Delivery.');
  }

  const user = await User.findById(req.user._id);
  if (!user.cart.length) {
    res.status(400);
    throw new Error('Your cart is empty');
  }

  // Resolve shipping address: either an existing saved one or a provided object.
  let ship = shippingAddress;
  if (addressId) {
    const addr = user.addresses.id(addressId);
    if (!addr) {
      res.status(400);
      throw new Error('Selected address not found');
    }
    ship = addr.toObject();
  }
  if (!ship?.line1 || !ship?.pincode) {
    res.status(400);
    throw new Error('A valid shipping address is required');
  }

  // Build authoritative line items from live product data + validate stock.
  // qty is re-sanitised here (defence-in-depth) so a tampered cart line can never
  // carry a negative/huge/NaN quantity into pricing or the stock decrement.
  const items = [];
  let itemsTotal = 0;
  for (const line of user.cart) {
    const qty = Math.min(MAX_QTY_PER_LINE, Math.max(1, Math.floor(Number(line.qty)) || 1));
    const product = await Product.findById(line.product);
    if (!product || !product.isActive) continue;

    const sizeEntry = product.sizes.find((s) => s.size === line.size);
    const available = sizeEntry ? sizeEntry.stock : product.stock;
    if (available < qty) {
      res.status(409);
      throw new Error(`Only ${available} left of ${product.name} (${line.size})`);
    }

    const price = product.effectivePrice;
    itemsTotal += price * qty;
    items.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0]?.url || '',
      price,
      size: line.size,
      color: line.color,
      qty,
      hasVariant: !!sizeEntry,
    });
  }

  if (!items.length) {
    res.status(400);
    throw new Error('No purchasable items in cart');
  }

  // ── Reserve stock atomically ───────────────────────────────────────────────
  // Each decrement is guarded by a `stock >= qty` filter so it can never oversell
  // or drive stock negative under concurrency. If any line can't be satisfied we
  // roll back everything reserved so far and fail the order.
  const reserved = [];
  for (const it of items) {
    const result = it.hasVariant
      ? await Product.updateOne(
          { _id: it.product, sizes: { $elemMatch: { size: it.size, stock: { $gte: it.qty } } } },
          { $inc: { 'sizes.$.stock': -it.qty, stock: -it.qty, soldCount: it.qty } }
        )
      : await Product.updateOne(
          { _id: it.product, stock: { $gte: it.qty } },
          { $inc: { stock: -it.qty, soldCount: it.qty } }
        );

    if (result.modifiedCount === 1) {
      reserved.push(it);
      continue;
    }
    // Shortfall — undo prior reservations and abort.
    await Promise.all(reserved.map(restockItem));
    res.status(409);
    throw new Error(`${it.name} (${it.size}) just went out of stock`);
  }

  // ── Coupon (optional) — atomic global limit + per-user limit ───────────────
  let discount = 0;
  let appliedCode = '';
  let claimedCouponId = null;
  if (couponCode) {
    const code = String(couponCode).toUpperCase();
    const coupon = await Coupon.findOne({ code });
    const check = coupon?.isValidFor(itemsTotal);
    if (coupon && check?.ok) {
      // Per-user cap: how many non-cancelled orders already used this code.
      let perUserOk = true;
      if (coupon.perUserLimit > 0) {
        const used = await Order.countDocuments({ user: user._id, couponCode: code, status: { $ne: 'Cancelled' } });
        perUserOk = used < coupon.perUserLimit;
      }
      // Atomic global claim: only increments if under usageLimit (0 = unlimited).
      if (perUserOk) {
        const claim = await Coupon.findOneAndUpdate(
          { _id: coupon._id, $or: [{ usageLimit: 0 }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] },
          { $inc: { usedCount: 1 } },
          { new: true }
        );
        if (claim) {
          discount = coupon.discountFor(itemsTotal);
          appliedCode = code;
          claimedCouponId = coupon._id;
        }
      }
    }
  }

  const taxable = itemsTotal - discount;
  const shippingFee = taxable >= FREE_SHIP_THRESHOLD ? 0 : SHIP_FEE;
  // Prices are tax-inclusive; compute the embedded GST for the invoice line.
  const gst = Math.round((taxable - taxable / (1 + GST_RATE)) * 100) / 100;
  const total = taxable + shippingFee;

  // Create the order. If this fails, undo the stock reservation and coupon claim
  // so a failed order never leaks inventory or a coupon redemption.
  let order;
  try {
    order = await Order.create({
      user: user._id,
      items,
      shippingAddress: ship,
      itemsTotal,
      discount,
      couponCode: appliedCode,
      shippingFee,
      gst,
      total,
      paymentMethod,
      paymentStatus: 'pending',
    });
  } catch (err) {
    await Promise.all(reserved.map(restockItem));
    if (claimedCouponId) await Coupon.updateOne({ _id: claimedCouponId }, { $inc: { usedCount: -1 } });
    throw err;
  }

  // Clear the cart after a successful order.
  user.cart = [];
  await user.save();

  res.status(201).json(order);
});

// @route  GET /api/orders/mine
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// @route  GET /api/orders/:id  (owner or admin)
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (String(order.user._id) !== String(req.user._id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorised to view this order');
  }
  res.json(order);
});

// @route  GET /api/orders/track/:orderNumber?contact=   (public tracking)
// Requires the phone number (or email) on the account so sequential order numbers
// (RB1001, RB1002…) can't be enumerated to harvest customers' names, phones and
// addresses. Only minimal, redacted fields are returned.
export const trackOrder = asyncHandler(async (req, res) => {
  // `contact` is a phone number or an email; `email` kept for older links.
  const raw = String(req.query.contact ?? req.query.email ?? req.body?.contact ?? req.body?.email ?? '').trim();
  if (!raw) {
    res.status(400);
    throw new Error('Please enter the phone number used to place the order');
  }

  const asPhone = normalizePhone(raw);          // null when it isn't phone-shaped
  const asEmail = raw.toLowerCase();

  const order = await Order.findOne({ orderNumber: req.params.orderNumber.toUpperCase() })
    .select('orderNumber status timeline total items createdAt deliveredAt shippingAddress user')
    .populate('user', 'email phone');

  // Same generic response whether the number is wrong or the contact doesn't
  // match, so the endpoint can't confirm which order numbers exist.
  const matches =
    order &&
    ((asPhone && order.user?.phone === asPhone) ||
      (order.user?.email && order.user.email.toLowerCase() === asEmail));

  if (!matches) {
    res.status(404);
    throw new Error('No order found matching those details');
  }

  const o = order.toObject();
  o.shippingAddress = o.shippingAddress
    ? { city: o.shippingAddress.city, state: o.shippingAddress.state } // redact street/phone
    : undefined;
  delete o.user;
  res.json(o);
});

// @route  PUT /api/orders/:id/cancel   (owner)
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (String(order.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorised');
  }
  if (['Shipped', 'Delivered', 'Cancelled'].includes(order.status)) {
    res.status(400);
    throw new Error(`Order cannot be cancelled once ${order.status.toLowerCase()}`);
  }
  order.status = 'Cancelled';
  order.cancelledAt = new Date();
  order.timeline.push({ status: 'Cancelled', note: 'Cancelled by customer' });

  // Restock the items.
  for (const it of order.items) {
    await Product.updateOne(
      { _id: it.product, 'sizes.size': it.size },
      { $inc: { 'sizes.$.stock': it.qty, stock: it.qty, soldCount: -it.qty } }
    );
  }
  await order.save();
  res.json(order);
});
