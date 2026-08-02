// pages/admin/Dashboard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin overview. Renders INSIDE AdminLayout, so this file paints ONLY the inner
// content (the light #f6f6f4 area). Everything lives in white rounded cards.
//
//   • adminApi.dashboard() → KPIs, a 7-day sales series, recent orders, top
//     products and low-stock alerts.
//   • KPI cards: responsive grid (2 cols mobile → 3 → 6) each with an emoji icon,
//     a label and a big number. Revenue is formatted in INR.
//   • "Sales — last 7 days" panel is a dependency-free CSS bar chart (bars scaled
//     to the max revenue in the window, with date labels underneath).
//   • Recent Orders table, Top Products list and a Low Stock alert list.
//
// Two levels deep (src/pages/admin) → shared imports climb two dirs ('../../').
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import useSEO from '../../hooks/useSEO.js';
import { adminApi } from '../../services/endpoints.js';
import PageLoader from '../../components/common/PageLoader.jsx';
import { price, inr, prettyDate } from '../../utils/format.js';

// Order status → pill colours, shared with the Orders screens.
const statusBadge = (status) => {
  switch (status) {
    case 'Delivered': return 'bg-[#eafaf1] text-success';
    case 'Shipped': return 'bg-[#eaf1fb] text-[#2b6cb0]';
    case 'Processing': return 'bg-[#f0ecfb] text-[#6b46c1]';
    case 'Cancelled': return 'bg-[#fdecea] text-[#c0392b]';
    default: return 'bg-[#fdf3e3] text-[#b7791f]'; // Placed
  }
};

// KPI card definitions — value is resolved from the fetched `kpis` object.
// Each has an emoji icon + a short label; revenue is money, the rest are counts.
const KPI_DEFS = [
  { key: 'revenue', label: 'Revenue', icon: '₹', money: true },
  { key: 'orders', label: 'Orders', icon: '🧾' },
  { key: 'customers', label: 'Customers', icon: '👤' },
  { key: 'products', label: 'Products', icon: '👕' },
  { key: 'itemsSold', label: 'Items Sold', icon: '📦' },
  { key: 'pending', label: 'Pending', icon: '⏳' },
];

export default function Dashboard() {
  useSEO({ title: 'Admin Dashboard', description: 'RICHBAYY store performance at a glance.' });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await adminApi.dashboard();
        if (alive) setData(res);
      } catch (err) {
        toast.error(err?.message || 'Could not load the dashboard.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <PageLoader />;
  if (!data) return <p className="text-[14px] text-muted">No dashboard data available.</p>;

  const { kpis = {}, salesSeries = [], recentOrders = [], topProducts = [], lowStock = [] } = data;
  // Largest revenue in the window — used to scale bar heights (avoid /0).
  const maxRevenue = Math.max(1, ...salesSeries.map((d) => d.revenue || 0));

  return (
    <div>
      {/* ── Header row ── */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[0.3px] lg:text-[26px]">Dashboard</h1>
          <p className="mt-1 text-[13.5px] text-muted">Welcome back — here&apos;s how the store is doing.</p>
        </div>
        <Link to="/admin/sales-report" className="btn-outline px-5 py-2.5 text-[12px]">View Sales Report</Link>
      </div>

      {/* ── KPI grid: 2 cols mobile → 3 → 6 ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {KPI_DEFS.map((k, i) => (
          <motion.div
            key={k.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
            className="rounded-xl border border-stone bg-white p-5 shadow-card"
          >
            <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-sand text-[16px]">{k.icon}</div>
            <div className="text-[11px] uppercase tracking-[1px] text-muted">{k.label}</div>
            <div className="mt-1 text-[22px] font-semibold tracking-[0.3px]">
              {k.money ? price(kpis[k.key]) : inr(kpis[k.key])}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Charts + lists ── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales bar chart (spans 2 cols on desktop) */}
        <div className="rounded-xl border border-stone bg-white p-5 shadow-card lg:col-span-2 lg:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[16px] font-semibold">Sales — last 7 days</h2>
            <span className="text-[12px] text-muted">Revenue (₹)</span>
          </div>

          {salesSeries.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-muted">No sales in this window yet.</p>
          ) : (
            <div className="flex h-52 items-end gap-2 sm:gap-4">
              {salesSeries.map((d) => {
                // Height as a % of the tallest bar; keep a small floor so 0 is visible.
                const pct = Math.max(2, Math.round(((d.revenue || 0) / maxRevenue) * 100));
                return (
                  <div key={d._id} className="group flex flex-1 flex-col items-center gap-2">
                    {/* Value label appears on hover */}
                    <span className="text-[10.5px] font-medium text-muted opacity-0 transition-opacity group-hover:opacity-100">
                      {price(d.revenue)}
                    </span>
                    <div className="flex w-full flex-1 items-end">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${pct}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="w-full rounded-t-md bg-ink transition-colors group-hover:bg-gold"
                        title={`${d._id}: ${price(d.revenue)} · ${d.orders} orders`}
                      />
                    </div>
                    {/* Date label (day + short month) */}
                    <span className="text-[10.5px] text-muted">
                      {new Date(d._id).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Low stock alert */}
        <div className="rounded-xl border border-stone bg-white p-5 shadow-card lg:p-6">
          <h2 className="mb-4 text-[16px] font-semibold">Low Stock Alert</h2>
          {lowStock.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted">Everything is well stocked. 🎉</p>
          ) : (
            <ul className="space-y-3">
              {lowStock.map((p) => (
                <li key={p._id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{p.name}</span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
                      p.stock <= 5 ? 'bg-[#fdecea] text-[#c0392b]' : 'bg-[#fdf3e3] text-[#b7791f]'
                    }`}
                  >
                    {p.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Recent orders + top products ── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent orders table (spans 2 cols) */}
        <div className="rounded-xl border border-stone bg-white p-5 shadow-card lg:col-span-2 lg:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-semibold">Recent Orders</h2>
            <Link to="/admin/orders" className="text-[12.5px] font-medium text-gold hover:underline">View all</Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted">No orders yet.</p>
          ) : (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-stone text-[11px] uppercase tracking-[1px] text-muted">
                    <th className="px-2 py-2.5 font-medium">Order</th>
                    <th className="px-2 py-2.5 font-medium">Customer</th>
                    <th className="px-2 py-2.5 font-medium">Total</th>
                    <th className="px-2 py-2.5 font-medium">Status</th>
                    <th className="px-2 py-2.5 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone">
                  {recentOrders.map((o) => (
                    <tr key={o._id} className="hover:bg-sand/60">
                      <td className="px-2 py-3 font-semibold tracking-[0.4px]">{o.orderNumber}</td>
                      <td className="px-2 py-3">
                        <div className="font-medium">{o.user?.name || '—'}</div>
                        <div className="text-[12px] text-muted">{o.user?.email}</div>
                      </td>
                      <td className="px-2 py-3 font-medium">{price(o.total)}</td>
                      <td className="px-2 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${statusBadge(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-muted">{prettyDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top products list */}
        <div className="rounded-xl border border-stone bg-white p-5 shadow-card lg:p-6">
          <h2 className="mb-4 text-[16px] font-semibold">Top Products</h2>
          {topProducts.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted">No sales data yet.</p>
          ) : (
            <ul className="space-y-4">
              {topProducts.map((p) => (
                <li key={p._id} className="flex items-center gap-3">
                  <div
                    className="h-12 w-10 shrink-0 overflow-hidden rounded bg-mist"
                    style={{ background: p.tint || undefined }}
                  >
                    {p.images?.[0]?.url && (
                      <img src={p.images[0].url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium">{p.name}</div>
                    <div className="text-[12px] text-muted">{p.soldCount} sold</div>
                  </div>
                  <div className="shrink-0 text-[13.5px] font-semibold">{price(p.price)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
