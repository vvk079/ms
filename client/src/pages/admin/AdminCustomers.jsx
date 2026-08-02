// pages/admin/AdminCustomers.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Customer directory. Renders INSIDE AdminLayout.
//
//   • adminApi.customers({ q, page }) → paginated customers with derived stats.
//   • Header: "Customers" + a search box (name / email).
//   • Table: name, email, phone, orders count, total spent (₹), joined date.
//   • Pagination.
//
// Two levels deep → shared imports climb two dirs ('../../').
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import useSEO from '../../hooks/useSEO.js';
import { adminApi } from '../../services/endpoints.js';
import { price, prettyDate } from '../../utils/format.js';

export default function AdminCustomers() {
  useSEO({ title: 'Customers', description: 'Browse and search RICHBAYY customers.' });

  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.customers({ page, q });
      setCustomers(data.customers || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(err?.message || 'Could not load customers.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, q]);

  useEffect(() => { load(); }, [load]);

  const onSearch = (e) => { e.preventDefault(); setPage(1); setQ(term.trim()); };

  // Simple monogram avatar from the customer's initials.
  const initials = (name = '') =>
    name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div>
      {/* ── Header row ── */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[0.3px] lg:text-[26px]">Customers</h1>
          <p className="mt-1 text-[13.5px] text-muted">{total} registered customer{total === 1 ? '' : 's'}.</p>
        </div>
        <form onSubmit={onSearch} className="flex gap-2">
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search name or email…" className="field max-w-[240px]" />
          <button type="submit" className="btn-outline shrink-0 px-5 py-3 text-[12px]">Search</button>
        </form>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-stone bg-white p-2 shadow-card sm:p-4">
        {loading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />)}
          </div>
        ) : customers.length === 0 ? (
          <p className="py-16 text-center text-[14px] text-muted">No customers found{q ? ` for “${q}”` : ''}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-stone text-[11px] uppercase tracking-[1px] text-muted">
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Phone</th>
                  <th className="px-3 py-3 font-medium">Orders</th>
                  <th className="px-3 py-3 font-medium">Total Spent</th>
                  <th className="px-3 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone">
                {customers.map((c) => (
                  <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-sand/60">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-semibold text-white">
                          {initials(c.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{c.name || '—'}</div>
                          <div className="truncate text-[12px] text-muted">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted">{c.phone || '—'}</td>
                    <td className="px-3 py-3">
                      <span className="inline-block rounded-full bg-sand px-2.5 py-0.5 text-[12px] font-semibold">{c.orders ?? 0}</span>
                    </td>
                    <td className="px-3 py-3 font-medium">{price(c.spent)}</td>
                    <td className="px-3 py-3 text-muted">{prettyDate(c.createdAt)}</td>
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
