// pages/admin/AdminProducts.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Product catalogue management. Renders INSIDE AdminLayout.
//
//   • productApi.list({ limit, page, keyword }) → paginated products.
//   • Header: "Products" + a "＋ Add Product" link (→ /admin/products/new).
//   • Search box filters by keyword (debounced-ish: search resets to page 1).
//   • On large screens a table; on mobile the same rows collapse to stacked cards.
//   • Each row: image thumb, name + SKU, category, price (+ strikethrough discount),
//     stock (red when low), status chips (Featured/New/Best/Inactive), and actions
//     Edit (→ /admin/products/:id/edit) and Delete (confirm → productApi.remove).
//   • Pagination controls at the bottom.
//
// Two levels deep → shared imports climb two dirs ('../../').
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import useSEO from '../../hooks/useSEO.js';
import { productApi } from '../../services/endpoints.js';
import { price } from '../../utils/format.js';

const PAGE_SIZE = 12;

// Small pill used for the product flag chips (Featured / New / Best / Inactive).
function Chip({ children, tone = 'ink' }) {
  const tones = {
    ink: 'bg-ink text-white',
    gold: 'bg-[#fdf3e3] text-[#b7791f]',
    green: 'bg-[#eafaf1] text-success',
    grey: 'bg-[#efeeeb] text-muted',
    red: 'bg-[#fdecea] text-[#c0392b]',
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

// Renders the flag chips for a product row (shared between table + cards).
function Flags({ p }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {p.featured && <Chip tone="ink">Featured</Chip>}
      {p.newArrival && <Chip tone="gold">New</Chip>}
      {p.bestSeller && <Chip tone="green">Best</Chip>}
      {!p.isActive && <Chip tone="red">Inactive</Chip>}
      {p.isActive && !p.featured && !p.newArrival && !p.bestSeller && <Chip tone="grey">Active</Chip>}
    </div>
  );
}

export default function AdminProducts() {
  useSEO({ title: 'Manage Products', description: 'Add, edit and organise the RICHBAYY catalogue.' });

  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');   // committed search term
  const [term, setTerm] = useState('');         // live input value
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch (or refetch) products for the current page + keyword.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productApi.list({ limit: PAGE_SIZE, page, keyword });
      setProducts(data.products || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(err?.message || 'Could not load products.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, keyword]);

  useEffect(() => { load(); }, [load]);

  // Submitting the search commits the term and jumps back to page 1.
  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setKeyword(term.trim());
  };

  const onDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    setDeletingId(p._id);
    try {
      await productApi.remove(p._id);
      toast.success('Product deleted.');
      // If we just removed the last item on a page, step back a page.
      if (products.length === 1 && page > 1) setPage((n) => n - 1);
      else await load();
    } catch (err) {
      toast.error(err?.message || 'Could not delete product.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {/* ── Header row ── */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[0.3px] lg:text-[26px]">Products</h1>
          <p className="mt-1 text-[13.5px] text-muted">{total} product{total === 1 ? '' : 's'} in the catalogue.</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary px-6 py-3 text-[12px]">＋ Add Product</Link>
      </div>

      {/* ── Search ── */}
      <form onSubmit={onSearch} className="mb-5 flex max-w-md gap-2">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search by name or SKU…"
          className="field"
        />
        <button type="submit" className="btn-outline shrink-0 px-5 py-3 text-[12px]">Search</button>
      </form>

      {/* ── List / table ── */}
      <div className="rounded-xl border border-stone bg-white p-2 shadow-card sm:p-4">
        {loading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-lg" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="py-16 text-center text-[14px] text-muted">
            No products found{keyword ? ` for “${keyword}”` : ''}.
          </p>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-left text-[13.5px] lg:table">
              <thead>
                <tr className="border-b border-stone text-[11px] uppercase tracking-[1px] text-muted">
                  <th className="px-3 py-3 font-medium">Product</th>
                  <th className="px-3 py-3 font-medium">Category</th>
                  <th className="px-3 py-3 font-medium">Price</th>
                  <th className="px-3 py-3 font-medium">Stock</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-sand/60">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-11 shrink-0 overflow-hidden rounded bg-mist" style={{ background: p.tint || undefined }}>
                          {p.images?.[0]?.url && <img src={p.images[0].url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{p.name}</div>
                          <div className="text-[12px] text-muted">{p.SKU || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted">{p.category?.name || '—'}</td>
                    <td className="px-3 py-3">
                      {p.discountPrice && p.discountPrice < p.price ? (
                        <span className="flex flex-col">
                          <span className="font-semibold">{price(p.discountPrice)}</span>
                          <span className="text-[12px] text-muted line-through">{price(p.price)}</span>
                        </span>
                      ) : (
                        <span className="font-semibold">{price(p.price)}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className={p.stock <= 5 ? 'font-semibold text-[#c0392b]' : 'font-medium'}>{p.stock}</span>
                    </td>
                    <td className="px-3 py-3"><Flags p={p} /></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/products/${p._id}/edit`} className="rounded-md border border-stone px-3 py-1.5 text-[12px] font-medium hover:bg-sand">Edit</Link>
                        <button
                          onClick={() => onDelete(p)}
                          disabled={deletingId === p._id}
                          className="rounded-md border border-[#e2b8b2] px-3 py-1.5 text-[12px] font-medium text-[#c0392b] hover:bg-[#fdecea] disabled:opacity-50"
                        >
                          {deletingId === p._id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile stacked cards */}
            <div className="space-y-3 lg:hidden">
              {products.map((p) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 rounded-lg border border-stone p-3"
                >
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded bg-mist" style={{ background: p.tint || undefined }}>
                    {p.images?.[0]?.url && <img src={p.images[0].url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium">{p.name}</div>
                    <div className="text-[12px] text-muted">{p.SKU || '—'} · {p.category?.name || '—'}</div>
                    <div className="mt-1 flex items-center gap-2">
                      {p.discountPrice && p.discountPrice < p.price ? (
                        <>
                          <span className="font-semibold">{price(p.discountPrice)}</span>
                          <span className="text-[12px] text-muted line-through">{price(p.price)}</span>
                        </>
                      ) : (
                        <span className="font-semibold">{price(p.price)}</span>
                      )}
                      <span className={`text-[12px] ${p.stock <= 5 ? 'font-semibold text-[#c0392b]' : 'text-muted'}`}>· {p.stock} in stock</span>
                    </div>
                    <div className="mt-2"><Flags p={p} /></div>
                    <div className="mt-3 flex gap-2">
                      <Link to={`/admin/products/${p._id}/edit`} className="rounded-md border border-stone px-3 py-1.5 text-[12px] font-medium hover:bg-sand">Edit</Link>
                      <button
                        onClick={() => onDelete(p)}
                        disabled={deletingId === p._id}
                        className="rounded-md border border-[#e2b8b2] px-3 py-1.5 text-[12px] font-medium text-[#c0392b] hover:bg-[#fdecea] disabled:opacity-50"
                      >
                        {deletingId === p._id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Pagination ── */}
      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((n) => Math.max(1, n - 1))}
            disabled={page <= 1}
            className="rounded-md border border-stone px-4 py-2 text-[13px] disabled:opacity-40 hover:bg-white"
          >
            ← Prev
          </button>
          <span className="px-2 text-[13px] text-muted">Page {page} of {pages}</span>
          <button
            onClick={() => setPage((n) => Math.min(pages, n + 1))}
            disabled={page >= pages}
            className="rounded-md border border-stone px-4 py-2 text-[13px] disabled:opacity-40 hover:bg-white"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
