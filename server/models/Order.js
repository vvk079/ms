// models/Order.js
// A placed order snapshots line items, the shipping address, price breakdown
// (incl. GST), payment + fulfilment status, and a human-friendly order number.
import mongoose from 'mongoose';
import Counter from './Counter.js';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    image: String,
    price: Number,      // unit price paid
    size: String,
    color: String,
    qty: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true }, // e.g. RB1008
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [orderItemSchema],

    // Address is embedded (snapshot) so later edits to the account don't mutate history.
    shippingAddress: {
      fullName: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },

    // Price breakdown (all INR).
    itemsTotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: '' },
    shippingFee: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },        // tax component (info; prices are tax-inclusive)
    total: { type: Number, required: true },

    paymentMethod: { type: String, enum: ['COD', 'ONLINE'], default: 'COD' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paymentInfo: {                            // filled by the payment gateway when integrated
      id: String,
      provider: String,
      signature: String,
    },

    status: {
      type: String,
      enum: ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Placed',
    },
    // Timeline entries power the Track Order UI.
    timeline: [
      {
        status: String,
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],

    deliveredAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true }
);

// Generate a sequential order number (RB + atomic counter) before save. Using a
// dedicated counter avoids the countDocuments()+1 race (duplicate numbers under
// concurrency) and post-deletion collisions.
orderSchema.pre('save', async function (next) {
  if (this.orderNumber) return next();
  const seq = await Counter.next('orderNumber'); // 1, 2, 3, …
  this.orderNumber = `RB${1000 + seq}`;          // → RB1001, RB1002, …
  this.timeline.push({ status: 'Placed', note: 'Order placed successfully' });
  next();
});

// Index status/paymentMethod used by admin aggregates & filters.
orderSchema.index({ status: 1 });
orderSchema.index({ paymentMethod: 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
