// pages/account/Orders.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The full order history. Renders INSIDE AccountLayout, so this file paints ONLY
// the inner content (heading + order cards).
//
//   • orderApi.mine() → list of orders; PageLoader shown while loading.
//   • Each order is a card: header (number, date, status badge, total), an items
//     list, and footer actions: "Track Order" (→ /track?order=RBxxxx) plus a
//     "Cancel Order" button for orders still 'Placed' or 'Processing'.
//   • Cancelling calls orderApi.cancel(id), then refreshes the list + toasts.
//   • Empty state when there are no orders.
//
// One level deeper than top-level pages → shared imports climb two dirs ('../../').
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import useSEO from '../../hooks/useSEO.js';
import { orderApi } from '../../services/endpoints.js';
import PageLoader from '../../components/common/PageLoader.jsx';
import { price, prettyDate } from '../../utils/format.js';

// Status → pill colours (kept consistent with the Profile summary).
const statusBadge = (status) => {
  switch (status) {
    case 'Delivered': return 'bg-[#eafaf1] text-success';
    case 'Shipped': return 'bg-[#eaf1fb] text-[#2b6cb0]';
    case 'Cancelled': return 'bg-[#fdecea] text-[#c0392b]';
    default: return 'bg-[#fdf3e3] text-[#b7791f]'; // Placed / Processing
  }
};

// Orders the customer is still allowed to cancel.
const CANCELLABLE = ['Placed', 'Processing'];

export default function Orders() {
  useSEO({ title: 'My Orders', description: 'View and track all your RICHBAYY orders in one place.' });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  // Track which order is mid-cancel so we can disable just that button.
  const [cancellingId, setCancellingId] = useState(null);

  // Load (or reload) the customer's orders. Reused after a cancellation.
  const load = useCallback(async () => {
    try {
      const data = await orderApi.mine();
      // Endpoint may return an array or { orders: [...] } — tolerate both.
      const list = Array.isArray(data) ? data : data?.orders || [];
      setOrders(list);
    } catch (err) {
      toast.error(err?.message || 'Could not load your orders.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onCancel = async (id) => {
    setCancellingId(id);
    try {
      await orderApi.cancel(id);
      toast.success('Order cancelled.');
      await load(); // refresh so the status/actions update
    } catch (err) {
      toast.error(err?.message || 'Could not cancel this order.');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 className="heading mb-6 text-[20px]">My Orders</h1>

      {orders.length === 0 ? (
        // ── Empty state ──
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone bg-sand py-16 text-center">
          <div className="mb-3 text-5xl">📦</div>
          <h3 className="mb-1 text-[18px] font-semibold">No orders yet</h3>
          <p className="mb-6 max-w-sm text-[13.5px] text-muted">
            When you place an order, it&apos;ll show up here so you can track it anytime.
          </p>
          <Link to="/shop" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((o, idx) => {
            const cancellable = CANCELLABLE.includes(o.status);
            return (
              <motion.article
                key={o._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.3) }}
                className="overflow-hidden rounded-xl border border-stone bg-paper shadow-card"
              >
                {/* ── Header row ── */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone bg-sand px-5 py-4">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                    <div>
                      <div className="text-[11px] uppercase tracking-[1px] text-muted">Order</div>
                      <div className="text-[14px] font-semibold tracking-[0.5px]">{o.orderNumber}</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[1px] text-muted">Placed on</div>
                      <div className="text-[14px] font-medium">{prettyDate(o.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-block rounded-full px-3 py-1 text-[11.5px] font-semibold ${statusBadge(o.status)}`}>
                      {o.status}
                    </span>
                    <div className="text-right">
                      <div className="text-[11px] uppercase tracking-[1px] text-muted">Total</div>
                      <div className="text-[15px] font-semibold">{price(o.total)}</div>
                    </div>
                  </div>
                </div>

                {/* ── Items list ── */}
                <ul className="divide-y divide-stone px-5">
                  {o.items?.map((it, i) => (
                    <li key={i} className="flex items-center gap-4 py-4">
                      <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded bg-mist">
                        {it.image && <img src={it.image} alt={it.name} className="h-full w-full object-cover" loading="lazy" />}
                        <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-[11px] font-medium text-white">
                          {it.qty}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-medium">{it.name}</div>
                        <div className="text-[12.5px] text-muted">
                          {it.size ? `Size ${it.size}` : ''}{it.size && it.color ? ' · ' : ''}{it.color || ''}{(it.size || it.color) ? ' · ' : ''}Qty {it.qty}
                        </div>
                      </div>
                      <div className="text-[13.5px] font-medium">{price(it.price * it.qty)}</div>
                    </li>
                  ))}
                </ul>

                {/* ── Footer actions ── */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone px-5 py-4">
                  <div className="text-[12.5px] text-muted">
                    {o.paymentMethod ? `Paid via ${o.paymentMethod}` : ''}
                    {o.status === 'Delivered' && o.deliveredAt ? ` · Delivered ${prettyDate(o.deliveredAt)}` : ''}
                  </div>
                  <div className="flex items-center gap-3">
                    <Link to={`/track?order=${o.orderNumber}`} className="btn-outline px-4 py-2 text-[12px]">
                      Track Order
                    </Link>
                    {cancellable && (
                      <button
                        onClick={() => onCancel(o._id)}
                        disabled={cancellingId === o._id}
                        className="rounded-md border border-[#e2b8b2] px-4 py-2 text-[12px] font-medium text-[#c0392b] transition-colors hover:bg-[#fdecea] disabled:opacity-50"
                      >
                        {cancellingId === o._id ? 'Cancelling…' : 'Cancel Order'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
