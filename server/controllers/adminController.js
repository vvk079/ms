// controllers/adminController.js
// Admin-only dashboard analytics, order management, customer management and
// inventory views. Product/category/coupon CRUD live in their own controllers.
import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import escapeRegex from '../utils/escapeRegex.js';

// @route  GET /api/admin/dashboard
// KPI cards + recent orders + a 7-day sales series + low-stock + top sellers.
export const getDashboard = asyncHandler(async (req, res) => {
  const [
    revenueAgg, orderCount, customerCount, productCount, pendingCount, recentOrders, topProducts, lowStock,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, items: { $sum: { $sum: '$items.qty' } } } },
    ]),
    Order.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Product.countDocuments(),
    Order.countDocuments({ status: { $in: ['Placed', 'Processing'] } }),
    Order.find().sort({ createdAt: -1 }).limit(8).populate('user', 'name email'),
    Product.find().sort({ soldCount: -1 }).limit(5).select('name soldCount price images tint'),
    Product.find({ stock: { $lte: 5 } }).limit(8).select('name stock sizes tint'),
  ]);

  // 7-day sales series (revenue per day).
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);
  const salesSeries = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    kpis: {
      revenue: revenueAgg[0]?.revenue || 0,
      itemsSold: revenueAgg[0]?.items || 0,
      orders: orderCount,
      customers: customerCount,
      products: productCount,
      pending: pendingCount,
    },
    salesSeries,
    recentOrders,
    topProducts,
    lowStock,
  });
});

// @route  GET /api/admin/orders?status=&page=
export const getAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 15;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) filter.orderNumber = new RegExp(escapeRegex(req.query.q), 'i');

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('user', 'name email'),
    Order.countDocuments(filter),
  ]);
  res.json({ orders, page, pages: Math.ceil(total / limit), total });
});

// @route  PUT /api/admin/orders/:id/status   body: { status, note }
const ORDER_STATUSES = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note = '' } = req.body;
  if (!ORDER_STATUSES.includes(status)) {
    res.status(400);
    throw new Error('Invalid order status');
  }
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  const wasCancelled = order.status === 'Cancelled';

  order.status = status;
  order.timeline.push({ status, note });

  if (status === 'Delivered') {
    order.deliveredAt = new Date();
    if (order.paymentMethod === 'COD') order.paymentStatus = 'paid';
  }

  // Cancelling from the admin panel must restock inventory (parity with the
  // customer self-cancel path) and mark a paid order as refunded.
  if (status === 'Cancelled' && !wasCancelled) {
    order.cancelledAt = new Date();
    if (order.paymentStatus === 'paid') order.paymentStatus = 'refunded';
    await Promise.all(
      order.items.map((it) =>
        Product.updateOne(
          { _id: it.product, 'sizes.size': it.size },
          { $inc: { 'sizes.$.stock': it.qty, stock: it.qty, soldCount: -it.qty } }
        )
      )
    );
  }

  await order.save();
  res.json(order);
});

// @route  GET /api/admin/customers?page=&q=
export const getCustomers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 15;
  const filter = { role: 'user' };
  if (req.query.q) { const rx = new RegExp(escapeRegex(req.query.q), 'i'); filter.$or = [{ name: rx }, { email: rx }]; }

  const [users, total] = await Promise.all([
    User.find(filter).select('name email phone createdAt').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);

  // Attach lifetime order stats per customer.
  const enriched = await Promise.all(
    users.map(async (u) => {
      const agg = await Order.aggregate([
        { $match: { user: u._id, status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, spent: { $sum: '$total' }, count: { $sum: 1 } } },
      ]);
      return { ...u.toObject(), orders: agg[0]?.count || 0, spent: agg[0]?.spent || 0 };
    })
  );
  res.json({ customers: enriched, page, pages: Math.ceil(total / limit), total });
});

// @route  GET /api/admin/sales-report?days=30
// Aggregated revenue/order series for the sales report screen.
export const getSalesReport = asyncHandler(async (req, res) => {
  const days = Math.min(365, parseInt(req.query.days) || 30);
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const series = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
        items: { $sum: { $sum: '$items.qty' } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byStatus = await Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const byPayment = await Order.aggregate([{ $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$total' } } }]);

  res.json({ series, byStatus, byPayment });
});
