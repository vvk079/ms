// pages/admin/AdminCategories.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Category management. Renders INSIDE AdminLayout.
//
//   • categoryApi.list() → grid of category cards (image/tint swatch, name, slug,
//     productCount, description).
//   • Header: "Categories" + "Add Category" (opens the modal in create mode).
//   • Add/Edit modal: name, description, tint hex, and an image (paste a URL OR
//     upload via uploadApi.images(fd, '/richbayy/categories') → image url).
//   • Delete (confirm). The backend blocks deleting a category that still has
//     products — we surface that error via toast.
//   • Refreshes the list after every create/update/delete.
//
// Two levels deep → shared imports climb two dirs ('../../').
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import useSEO from '../../hooks/useSEO.js';
import { categoryApi, uploadApi } from '../../services/endpoints.js';

const emptyForm = { name: '', description: '', tint: '#f2f1ef', image: '', order: 0 };

export default function AdminCategories() {
  useSEO({ title: 'Manage Categories', description: 'Organise the RICHBAYY catalogue into categories.' });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);      // null → create mode
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryApi.list();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.message || 'Could not load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Open modal in create or edit mode.
  const openCreate = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (c) => {
    setEditingId(c._id);
    setForm({ name: c.name || '', description: c.description || '', tint: c.tint || '#f2f1ef', image: c.image || '', order: c.order || 0 });
    setModalOpen(true);
  };
  const closeModal = () => { if (!saving) setModalOpen(false); };

  // Upload an image for the category and store the returned URL.
  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('images', file);
    setUploading(true);
    try {
      const res = await uploadApi.images(fd, '/richbayy/categories');
      const url = res.images?.[0]?.url;
      if (url) { set('image', url); toast.success('Image uploaded.'); }
    } catch (err) {
      toast.error(err?.message || 'Image upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Category name is required.');
    setSaving(true);
    try {
      const payload = { ...form, order: Number(form.order) || 0 };
      if (editingId) { await categoryApi.update(editingId, payload); toast.success('Category updated.'); }
      else { await categoryApi.create(payload); toast.success('Category created.'); }
      setModalOpen(false);
      await load();
    } catch (err) {
      toast.error(err?.message || 'Could not save the category.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (c) => {
    if (!window.confirm(`Delete "${c.name}"?`)) return;
    setDeletingId(c._id);
    try {
      await categoryApi.remove(c._id);
      toast.success('Category deleted.');
      await load();
    } catch (err) {
      // Backend blocks deletion when products still reference the category.
      toast.error(err?.message || 'Could not delete this category.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {/* ── Header row ── */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[0.3px] lg:text-[26px]">Categories</h1>
          <p className="mt-1 text-[13.5px] text-muted">{categories.length} categor{categories.length === 1 ? 'y' : 'ies'}.</p>
        </div>
        <button onClick={openCreate} className="btn-primary px-6 py-3 text-[12px]">＋ Add Category</button>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-40 rounded-xl" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone bg-white py-16 text-center">
          <div className="mb-3 text-4xl">🗂️</div>
          <p className="text-[14px] text-muted">No categories yet. Add your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-xl border border-stone bg-white shadow-card"
            >
              {/* Image or tint swatch header */}
              <div className="h-28 w-full" style={{ background: c.tint || '#f2f1ef' }}>
                {c.image && <img src={c.image} alt={c.name} className="h-full w-full object-cover" loading="lazy" />}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-semibold">{c.name}</h3>
                    <p className="text-[12px] text-muted">/{c.slug}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-sand px-2.5 py-0.5 text-[11.5px] font-semibold">
                    {c.productCount ?? 0} items
                  </span>
                </div>
                {c.description && <p className="mt-2 line-clamp-2 text-[12.5px] text-muted">{c.description}</p>}
                <div className="mt-4 flex gap-2">
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
          ))}
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
              <h2 className="mb-5 text-[18px] font-semibold">{editingId ? 'Edit Category' : 'New Category'}</h2>
              <form onSubmit={onSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[12.5px] font-medium">Name <span className="text-[#c0392b]">*</span></span>
                  <input value={form.name} onChange={(e) => set('name', e.target.value)} className="field" placeholder="e.g. Linen Shirts" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12.5px] font-medium">Description</span>
                  <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className="field resize-y" />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-1.5 block text-[12.5px] font-medium">Tint</span>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.tint} onChange={(e) => set('tint', e.target.value)} className="h-10 w-12 cursor-pointer rounded border border-stone bg-white p-1" />
                      <input value={form.tint} onChange={(e) => set('tint', e.target.value)} className="field" />
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[12.5px] font-medium">Order</span>
                    <input type="number" value={form.order} onChange={(e) => set('order', e.target.value)} className="field" />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-[12.5px] font-medium">Image URL</span>
                  <input value={form.image} onChange={(e) => set('image', e.target.value)} className="field" placeholder="https://… or upload below" />
                </label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={onUpload} disabled={uploading}
                    className="block w-full text-[13px] text-muted file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-ink file:px-4 file:py-2 file:text-[12px] file:text-white hover:file:bg-[#2a2a2a] disabled:opacity-50" />
                  {form.image && <img src={form.image} alt="Preview" className="h-12 w-12 shrink-0 rounded object-cover" />}
                </div>
                {uploading && <p className="text-[12px] text-muted">Uploading…</p>}

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
