// pages/admin/AdminCoupons.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Coupon management. Renders INSIDE AdminLayout.
//
//   • couponApi.list() → cards showing: code (mono badge), description, type/value
//     ("10%" or "₹200"), min cart, usedCount / usageLimit, active state + expiry.
//   • Header: "Coupons" + "Add Coupon" (opens the modal in create mode).
//   • Add/Edit modal: code, description, type (percent/flat), value, minCart,
//     maxDiscount, usageLimit, expiresAt (date), isActive.
//   • Delete (confirm). Refreshes after every create/update/delete.
//
// coupon shape: { _id, code, description, type:'percent'|'flat', value, minCart,
//   maxDiscount, usageLimit, usedCount, expiresAt, isActive }
//
// Two levels deep → shared imports climb two dirs ('../../').
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import useSEO from '../../hooks/useSEO.js';
import { couponApi } from '../../services/endpoints.js';
import { price, prettyDate } from '../../utils/format.js';

const emptyForm = {
  code: '', description: '', type: 'percent', value: '',
  minCart: '', maxDiscount: '', usageLimit: '', expiresAt: '', isActive: true,
};

// Format a coupon's benefit for display: "10%" or "₹200".
const benefit = (c) => (c.type === 'percent' ? `${c.value}%` : price(c.value));

// Turn a stored ISO date into the yyyy-mm-dd a <input type="date"> expects.
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export default function AdminCoupons() {
  useSEO({ title: 'Coupons', description: 'Create and manage RICHBAYY discount coupons.' });

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await couponApi.list();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.message || 'Could not load coupons.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (c) => {
    setEditingId(c._id);
    setForm({
      code: c.code || '', description: c.description || '', type: c.type || 'percent',
      value: c.value ?? '', minCart: c.minCart ?? '', maxDiscount: c.maxDiscount ?? '',
      usageLimit: c.usageLimit ?? '', expiresAt: toDateInput(c.expiresAt), isActive: c.isActive !== false,
    });
    setModalOpen(true);
  };
  const closeModal = () => { if (!saving) setModalOpen(false); };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) return toast.error('Coupon code is required.');
    if (form.value === '' || Number(form.value) <= 0) return toast.error('A valid value is required.');
    setSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        value: Number(form.value),
        minCart: form.minCart === '' ? 0 : Number(form.minCart),
        maxDiscount: form.maxDiscount === '' ? undefined : Number(form.maxDiscount),
        usageLimit: form.usageLimit === '' ? undefined : Number(form.usageLimit),
        expiresAt: form.expiresAt || undefined,
      };
      if (editingId) { await couponApi.update(editingId, payload); toast.success('Coupon updated.'); }
      else { await couponApi.create(payload); toast.success('Coupon created.'); }
      setModalOpen(false);
      await load();
    } catch (err) {
      toast.error(err?.message || 'Could not save the coupon.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (c) => {
    if (!window.confirm(`Delete coupon "${c.code}"?`)) return;
    setDeletingId(c._id);
    try {
      await couponApi.remove(c._id);
      toast.success('Coupon deleted.');
      await load();
    } catch (err) {
      toast.error(err?.message || 'Could not delete this coupon.');
    } finally {
      setDeletingId(null);
    }
  };

  // A coupon is expired when its expiry date is in the past.
  const isExpired = (c) => c.expiresAt && new Date(c.expiresAt) < new Date();

  return (
    <div>
      {/* ── Header row ── */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[0.3px] lg:text-[26px]">Coupons</h1>
          <p className="mt-1 text-[13.5px] text-muted">{coupons.length} coupon{coupons.length === 1 ? '' : 's'}.</p>
        </div>
        <button onClick={openCreate} className="btn-primary px-6 py-3 text-[12px]">＋ Add Coupon</button>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-44 rounded-xl" />)}
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone bg-white py-16 text-center">
          <div className="mb-3 text-4xl">🎟️</div>
          <p className="text-[14px] text-muted">No coupons yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => {
            const expired = isExpired(c);
            return (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col rounded-xl border border-stone bg-white p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-md bg-ink px-3 py-1 font-mono text-[13px] font-semibold tracking-[1px] text-white">{c.code}</span>
                  <span className="text-[22px] font-semibold text-gold">{benefit(c)}</span>
                </div>

                {c.description && <p className="mt-3 text-[13px] text-muted">{c.description}</p>}

                <dl className="mt-4 grid grid-cols-2 gap-y-2 text-[12.5px]">
                  <dt className="text-muted">Min cart</dt>
                  <dd className="text-right font-medium">{c.minCart ? price(c.minCart) : '—'}</dd>
                  <dt className="text-muted">Max discount</dt>
                  <dd className="text-right font-medium">{c.maxDiscount ? price(c.maxDiscount) : '—'}</dd>
                  <dt className="text-muted">Used</dt>
                  <dd className="text-right font-medium">{c.usedCount ?? 0}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</dd>
                  <dt className="text-muted">Expires</dt>
                  <dd className="text-right font-medium">{c.expiresAt ? prettyDate(c.expiresAt) : 'Never'}</dd>
                </dl>

                {/* Status + actions */}
                <div className="mt-4 flex items-center justify-between border-t border-stone pt-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
                      expired ? 'bg-[#fdecea] text-[#c0392b]' : c.isActive ? 'bg-[#eafaf1] text-success' : 'bg-[#efeeeb] text-muted'
                    }`}
                  >
                    {expired ? 'Expired' : c.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="rounded-md border border-stone px-3 py-1.5 text-[12px] font-medium hover:bg-sand">Edit</button>
                    <button
                      onClick={() => onDelete(c)}
                      disabled={deletingId === c._id}
                      className="rounded-md border border-[#e2b8b2] px-3 py-1.5 text-[12px] font-medium text-[#c0392b] hover:bg-[#fdecea] disabled:opacity-50"
                    >
                      {deletingId === c._id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Add/Edit modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lift"
              initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-5 text-[18px] font-semibold">{editingId ? 'Edit Coupon' : 'New Coupon'}</h2>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-1.5 block text-[12.5px] font-medium">Code <span className="text-[#c0392b]">*</span></span>
                    <input value={form.code} onChange={(e) => set('code', e.target.value)} className="field font-mono uppercase" placeholder="WELCOME10" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[12.5px] font-medium">Type</span>
                    <select value={form.type} onChange={(e) => set('type', e.target.value)} className="field">
                      <option value="percent">Percent (%)</option>
                      <option value="flat">Flat (₹)</option>
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[12.5px] font-medium">Description</span>
                  <input value={form.description} onChange={(e) => set('description', e.target.value)} className="field" placeholder="10% off your first order" />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-1.5 block text-[12.5px] font-medium">Value <span className="text-[#c0392b]">*</span></span>
                    <input type="number" min="0" value={form.value} onChange={(e) => set('value', e.target.value)} className="field" placeholder={form.type === 'percent' ? '10' : '200'} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[12.5px] font-medium">Min cart (₹)</span>
                    <input type="number" min="0" value={form.minCart} onChange={(e) => set('minCart', e.target.value)} className="field" placeholder="999" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[12.5px] font-medium">Max discount (₹)</span>
                    <input type="number" min="0" value={form.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} className="field" placeholder="500" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[12.5px] font-medium">Usage limit</span>
                    <input type="number" min="0" value={form.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} className="field" placeholder="100" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[12.5px] font-medium">Expires at</span>
                    <input type="date" value={form.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} className="field" />
                  </label>
                  <label className="mt-6 flex cursor-pointer items-center gap-2 text-[13.5px]">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="h-4 w-4 accent-ink" />
                    Active
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="btn-outline px-5 py-2.5 text-[12px]">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 text-[12px]">
                    {saving ? 'Saving…' : editingId ? 'Save' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
