// pages/OrderSuccess.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The confirmation screen shown right after an order is placed. It fetches the
// freshly created order by id (from the route param), then celebrates the
// purchase with a premium layout:
//   • a green success badge + "Thank you for your order!"
//   • the prominent order number + estimated delivery window
//   • the ordered items, a price breakdown and the shipping address
//   • payment method + status
//   • CTAs: Track Order · Continue Shopping · View My Orders
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import useSEO from '../hooks/useSEO.js';
import { orderApi } from '../services/endpoints.js';
import PageLoader from '../components/common/PageLoader.jsx';
import { CheckCircle } from '../components/common/Icons.jsx';
import { price, prettyDate, deliveryEstimate } from '../utils/format.js';

export default function OrderSuccess() {
  useSEO({
    title: 'Order Confirmed',
    description: 'Your RICHBAYY order has been placed successfully.',
  });

  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch the order once we know its id.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await orderApi.get(id);
        if (alive) setOrder(data);
      } catch (err) {
        if (alive) setError(err?.message || 'We could not find this order.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) return <PageLoader />;

  // Graceful fallback if the order can't be loaded.
  if (error || !order) {
    return (
      <div className="section-x flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
        <h1 className="mb-2 text-[22px] font-medium">Something went wrong</h1>
        <p className="mb-7 max-w-sm text-[14px] text-muted">{error || 'Order not found.'}</p>
        <Link to="/shop" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="section-x py-10 lg:py-14">
      <div className="mx-auto max-w-3xl">
        {/* ── Success header ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
          className="mb-8 text-center"
        >
          <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-[#eaf5ee]">
            <CheckCircle size={44} />
          </div>
          <h1 className="mb-2 text-[26px] font-semibold tracking-[0.5px] sm:text-[30px]">
            Thank you for your order!
          </h1>
          <p className="text-[14px] text-muted">
            Your order has been placed and is now being processed.
          </p>

          {/* Prominent order number */}
          <div className="mt-6 inline-flex flex-col items-center rounded-xl border border-stone bg-sand px-8 py-4">
            <span className="text-[11px] uppercase tracking-[2px] text-muted">Order Number</span>
            <span className="text-[22px] font-semibold tracking-[1px]">{order.orderNumber}</span>
          </div>

          {/* Estimated delivery */}
          <p className="mt-4 text-[13px] text-muted">
            Estimated delivery:{' '}
            <span className="font-semibold text-ink">{deliveryEstimate()}</span>
          </p>
        </motion.div>

        {/* ── Ordered items ───────────────────────────────────── */}
        <section className="rounded-xl border border-stone bg-paper p-6 shadow-card">
          <h2 className="mb-4 text-[15px] font-semibold tracking-[0.5px]">Order Details</h2>
          <ul className="space-y-4">
            {order.items.map((it, i) => (
              <li key={i} className="flex gap-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded bg-mist">
                  {it.image && <img src={it.image} alt={it.name} className="h-full w-full object-cover" loading="lazy" />}
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-[11px] font-medium text-white">
                    {it.qty}
                  </span>
                </div>
                <div className="flex-1 text-[13px]">
                  <div className="font-medium">{it.name}</div>
                  <div className="text-muted">
                    {it.size}{it.color ? ` · ${it.color}` : ''}
                  </div>
                  <div className="mt-1 text-muted">Qty: {it.qty}</div>
                </div>
                <div className="text-[13px] font-medium">{price(it.price * it.qty)}</div>
              </li>
            ))}
          </ul>

          {/* Price breakdown */}
          <div className="mt-6 space-y-2.5 border-t border-stone pt-4 text-[13px]">
            <Row label="Items Total" value={price(order.itemsTotal)} />
            {order.discount > 0 && (
              <Row
                label={`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`}
                value={<span className="text-success">− {price(order.discount)}</span>}
              />
            )}
            <Row
              label="Shipping"
              value={order.shippingFee === 0 ? <span className="text-success">FREE</span> : price(order.shippingFee)}
            />
            {order.gst > 0 && <Row label="GST (incl.)" value={price(order.gst)} muted />}
            <div className="flex items-center justify-between border-t border-stone pt-3 text-[16px] font-semibold">
              <span>Total Paid</span>
              <span>{price(order.total)}</span>
            </div>
          </div>
        </section>

        {/* ── Shipping + payment ──────────────────────────────── */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Shipping address */}
          <div className="rounded-xl border border-stone bg-paper p-6 shadow-card">
            <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[1px] text-muted">
              Shipping Address
            </h3>
            <div className="text-[13px] leading-relaxed">
              <div className="font-semibold">{order.shippingAddress.fullName}</div>
              <div className="text-muted">
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}
              </div>
              <div className="text-muted">
                {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
              </div>
              <div className="text-muted">{order.shippingAddress.country}</div>
              <div className="mt-1 text-muted">Phone: {order.shippingAddress.phone}</div>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-stone bg-paper p-6 shadow-card">
            <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[1px] text-muted">
              Payment
            </h3>
            <div className="space-y-2 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-muted">Method</span>
                <span className="font-medium">
                  {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Status</span>
                <span className={`font-medium capitalize ${order.paymentStatus === 'paid' ? 'text-success' : order.paymentStatus === 'failed' ? 'text-[#c0392b]' : 'text-gold'}`}>
                  {order.paymentStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Order Status</span>
                <span className="font-medium">{order.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Placed On</span>
                <span className="font-medium">{prettyDate(order.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── CTAs ────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to={`/track?order=${order.orderNumber}`} className="btn-primary">
            Track Order
          </Link>
          <Link to="/shop" className="btn-outline">
            Continue Shopping
          </Link>
          <Link to="/account/orders" className="btn-outline">
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}

// Small presentational helper for a label/value summary row.
function Row({ label, value, muted = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? 'text-muted' : ''}>{label}</span>
      <span className={muted ? 'text-muted' : 'font-medium'}>{value}</span>
    </div>
  );
}
