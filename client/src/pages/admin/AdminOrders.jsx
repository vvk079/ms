// pages/admin/AdminOrders.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Order management. Renders INSIDE AdminLayout.
//
//   • adminApi.orders({ status, q, page }) → paginated orders.
//   • Header: "Orders" + status filter tabs (All / Placed / Processing / Shipped /
//     Delivered / Cancelled) and a search box (by order number).
//   • Table columns: order#, customer (name/email), total, payment (method+status),
//     current status as an inline <select> that calls adminApi.updateOrderStatus,
//     and the placed-on date.
//   • Pagination + colour-coded status badges.
//
// Two levels deep → shared imports climb two dirs ('../../').
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import useSEO from '../../hooks/useSEO.js';
import { adminApi } from '../../services/endpoints.js';
import { price, prettyDate } from '../../utils/format.js';

// The lifecycle statuses an order can move through.
const STATUSES = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
// Filter tabs — "All" plus each status.
const TABS = ['All', ...STATUSES];

// Status → badge + select accent colours.
const statusStyle = (status) => {
  switch (status) {
    case 'Delivered': return 'bg-[#eafaf1] text-success border-[#bfe6cd]';
    case 'Shipped': return 'bg-[#eaf1fb] text-[#2b6cb0] border-[#c2d8f2]';
    case 'Processing': return 'bg-[#f0ecfb] text-[#6b46c1] border-[#d6c9f0]';
    case 'Cancelled': return 'bg-[#fdecea] text-[#c0392b] border-[#f0c6c0]';
    default: return 'bg-[#fdf3e3] text-[#b7791f] border-[#f0dcae]'; // Placed
  }
};

// Payment status → text colour. (Model stores lowercase: pending|paid|failed|refunded.)
const payStyle = (status) =>
  status === 'paid' ? 'text-success' : status === 'failed' ? 'text-[#c0392b]' : 'text-muted';

export default function AdminOrders() {
  useSEO({ title: 'Manage Orders', description: 'Track and update RICHBAYY customer orders.' });

  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');            // committed search
  const [term, setTerm] = useState('');      // live input
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, q };
      if (status !== 'All') params.status = status;
      const data = await adminApi.orders(params);
      setOrders(data.orders || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(err?.message || 'Could not load orders.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, q, status]);

  useEffect(() => { load(); }, [load]);

  const onSearch = (e) => { e.preventDefault(); setPage(1); setQ(term.trim()); };

  const onStatusTab = (tab) => { setStatus(tab); setPage(1); };

  // Inline status change from the row <select>.
  const onChangeStatus = async (order, next) => {
    if (next === order.status) return;
    setUpdatingId(order._id);
    try {
      await adminApi.updateOrderStatus(order._id, { status: next });
      toast.success(`Order ${order.orderNumber} → ${next}`);
      // Optimistically reflect the new status without a full reload.
      setOrders((list) => list.map((o) => (o._id === order._id ? { ...o, status: next } : o)));
    } catch (err) {
      toast.error(err?.message || 'Could not update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      {/* ── Header row ── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[0.3px] lg:text-[26px]">Orders</h1>
          <p className="mt-1 text-[13.5px] text-muted">{total} order{total === 1 ? '' : 's'} total.</p>
        </div>
        <form onSubmit={onSearch} className="flex gap-2">
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Order number…" className="field max-w-[220px]" />
          <button type="submit" className="btn-outline shrink-0 px-5 py-3 text-[12px]">Search</button>
        </form>
      </div>

      {/* ── Status tabs ── */}
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => onStatusTab(t)}
            className={`rounded-full border px-4 py-1.5 text-[12.5px] font-medium transition-colors ${
              status === t ? 'border-ink bg-ink text-white' : 'border-stone bg-white text-muted hover:bg-sand'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-stone bg-white p-2 shadow-card sm:p-4">
        {loading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />)}
          </div>
        ) : orders.length === 0 ? (
          <p className="py-16 text-center text-[14px] text-muted">No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-stone text-[11px] uppercase tracking-[1px] text-muted">
                  <th className="px-3 py-3 font-medium">Order</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Total</th>
                  <th className="px-3 py-3 font-medium">Payment</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone">
                {orders.map((o) => (
                  <motion.tr key={o._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-sand/60">
                    <td className="px-3 py-3 font-semibold tracking-[0.4px]">{o.orderNumber}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{o.user?.name || '—'}</div>
                      <div className="text-[12px] text-muted">{o.user?.email}</div>
                    </td>
                    <td className="px-3 py-3 font-medium">{price(o.total)}</td>
                    <td className="px-3 py-3">
                      <div>{o.paymentMethod || '—'}</div>
                      <div className={`text-[12px] font-medium capitalize ${payStyle(o.paymentStatus)}`}>{o.paymentStatus || 'pending'}</div>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={o.status}
                        disabled={updatingId === o._id}
                        onChange={(e) => onChangeStatus(o, e.target.value)}
                        className={`cursor-pointer rounded-md border px-2.5 py-1.5 text-[12.5px] font-semibold outline-none disabled:opacity-50 ${statusStyle(o.status)}`}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-3 text-muted">{prettyDate(o.createdAt)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button onClick={() => setPage((n) => Math.max(1, n - 1))} disabled={page <= 1} className="rounded-md border border-stone px-4 py-2 text-[13px] disabled:opacity-40 hover:bg-white">← Prev</button>
          <span className="px-2 text-[13px] text-muted">Page {page} of {pages}</span>
          <button onClick={() => setPage((n) => Math.min(pages, n + 1))} disabled={page >= pages} className="rounded-md border border-stone px-4 py-2 text-[13px] disabled:opacity-40 hover:bg-white">Next →</button>
        </div>
      )}
    </div>
  );
}
