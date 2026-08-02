// pages/admin/SalesReport.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Sales analytics over a selectable window. Renders INSIDE AdminLayout.
//
//   • adminApi.salesReport(days) → { series, byStatus, byPayment }.
//   • Header: "Sales Report" + a 7 / 30 / 90-day selector.
//   • Summary cards: total revenue, total orders, total items over the range.
//   • A dependency-free CSS revenue bar chart from `series`.
//   • "Orders by Status" breakdown (byStatus) as labelled proportion bars.
//   • "Revenue by Payment" (byPayment) with count + revenue per method.
//
// Two levels deep → shared imports climb two dirs ('../../').
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import useSEO from '../../hooks/useSEO.js';
import { adminApi } from '../../services/endpoints.js';
import { price, inr } from '../../utils/format.js';
import PageLoader from '../../components/common/PageLoader.jsx';

const RANGES = [7, 30, 90];

// Status → bar colour for the "Orders by Status" breakdown.
const statusColor = (status) => {
  switch (status) {
    case 'Delivered': return '#2e8b57';
    case 'Shipped': return '#2b6cb0';
    case 'Processing': return '#6b46c1';
    case 'Cancelled': return '#c0392b';
    default: return '#b7791f'; // Placed
  }
};

export default function SalesReport() {
  useSEO({ title: 'Sales Report', description: 'RICHBAYY revenue, orders and payment analytics.' });

  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.salesReport(days);
      setData(res);
    } catch (err) {
      toast.error(err?.message || 'Could not load the sales report.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const { series = [], byStatus = [], byPayment = [] } = data || {};

  // Derived totals over the whole window.
  const totalRevenue = series.reduce((s, d) => s + (d.revenue || 0), 0);
  const totalOrders = series.reduce((s, d) => s + (d.orders || 0), 0);
  const totalItems = series.reduce((s, d) => s + (d.items || 0), 0);

  // Scaling references for the bars.
  const maxRevenue = Math.max(1, ...series.map((d) => d.revenue || 0));
  const statusTotal = Math.max(1, byStatus.reduce((s, x) => s + (x.count || 0), 0));

  return (
    <div>
      {/* ── Header row ── */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[0.3px] lg:text-[26px]">Sales Report</h1>
          <p className="mt-1 text-[13.5px] text-muted">Performance over the last {days} days.</p>
        </div>
        {/* Days selector */}
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={`rounded-full border px-4 py-1.5 text-[12.5px] font-medium transition-colors ${
                days === r ? 'border-ink bg-ink text-white' : 'border-stone bg-white text-muted hover:bg-sand'
              }`}
            >
              {r} days
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <>
          {/* ── Summary cards ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: 'Total Revenue', value: price(totalRevenue), icon: '₹' },
              { label: 'Total Orders', value: inr(totalOrders), icon: '🧾' },
              { label: 'Items Sold', value: inr(totalItems), icon: '📦' },
            ].map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="rounded-xl border border-stone bg-white p-6 shadow-card"
              >
                <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-sand text-[16px]">{c.icon}</div>
                <div className="text-[11px] uppercase tracking-[1px] text-muted">{c.label}</div>
                <div className="mt-1 text-[24px] font-semibold tracking-[0.3px]">{c.value}</div>
              </motion.div>
            ))}
          </div>

          {/* ── Revenue bar chart ── */}
          <div className="mt-6 rounded-xl border border-stone bg-white p-5 shadow-card lg:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold">Revenue trend</h2>
              <span className="text-[12px] text-muted">Revenue (₹) per day</span>
            </div>
            {series.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-muted">No sales in this window.</p>
            ) : (
              <div className="flex h-56 items-end gap-1 overflow-x-auto">
                {series.map((d) => {
                  const pct = Math.max(2, Math.round(((d.revenue || 0) / maxRevenue) * 100));
                  return (
                    <div key={d._id} className="group flex min-w-[10px] flex-1 flex-col items-center gap-2">
                      <div className="flex w-full flex-1 items-end">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${pct}%` }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className="w-full rounded-t bg-ink transition-colors group-hover:bg-gold"
                          title={`${d._id}: ${price(d.revenue)} · ${d.orders} orders · ${d.items} items`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* First/last date labels — individual labels would crowd for 90 days. */}
            {series.length > 0 && (
              <div className="mt-2 flex justify-between text-[11px] text-muted">
                <span>{new Date(series[0]._id).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                <span>{new Date(series[series.length - 1]._id).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
              </div>
            )}
          </div>

          {/* ── Breakdowns ── */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Orders by status */}
            <div className="rounded-xl border border-stone bg-white p-5 shadow-card lg:p-6">
              <h2 className="mb-5 text-[16px] font-semibold">Orders by Status</h2>
              {byStatus.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-muted">No data.</p>
              ) : (
                <ul className="space-y-4">
                  {byStatus.map((s) => {
                    const pct = Math.round(((s.count || 0) / statusTotal) * 100);
                    return (
                      <li key={s._id}>
                        <div className="mb-1 flex items-center justify-between text-[13px]">
                          <span className="font-medium">{s._id}</span>
                          <span className="text-muted">{inr(s.count)} ({pct}%)</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-sand">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: statusColor(s._id) }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Revenue by payment */}
            <div className="rounded-xl border border-stone bg-white p-5 shadow-card lg:p-6">
              <h2 className="mb-5 text-[16px] font-semibold">Revenue by Payment</h2>
              {byPayment.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-muted">No data.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13.5px]">
                    <thead>
                      <tr className="border-b border-stone text-[11px] uppercase tracking-[1px] text-muted">
                        <th className="py-2.5 font-medium">Method</th>
                        <th className="py-2.5 text-right font-medium">Orders</th>
                        <th className="py-2.5 text-right font-medium">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone">
                      {byPayment.map((p) => (
                        <tr key={p._id}>
                          <td className="py-3 font-medium">{p._id || '—'}</td>
                          <td className="py-3 text-right text-muted">{inr(p.count)}</td>
                          <td className="py-3 text-right font-semibold">{price(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
