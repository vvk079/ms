// pages/admin/ProductForm.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Create + Edit a product. Renders INSIDE AdminLayout.
//
//   • useParams().id → edit mode: productApi.get(id) prefills the form.
//     No id → create mode (blank form).
//   • Fully controlled form state grouped into sections:
//       Basic     — name, description, brand, category, gender, material, fit, care, SKU
//       Pricing    — price, discountPrice
//       Tint       — a single hex + live swatch (used as the product card background)
//       Colors     — dynamic rows of { name, hex }, add/remove
//       Sizes      — a stock number per SIZE → compiled into sizes[] on submit
//       Images     — upload (multiple → uploadApi.images) AND paste-a-URL; thumbnails
//                    with a remove button; stores { url, fileId }
//       Flags      — featured / newArrival / bestSeller / isActive checkboxes
//   • Validates required fields (name, category, price) before submitting.
//   • Submit → productApi.create / update → toast → navigate('/admin/products').
//
// Two levels deep → shared imports climb two dirs ('../../').
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import useSEO from '../../hooks/useSEO.js';
import { productApi, categoryApi, uploadApi } from '../../services/endpoints.js';
import { SIZES } from '../../utils/constants.js';
import PageLoader from '../../components/common/PageLoader.jsx';

const GENDERS = ['Men', 'Women', 'Unisex'];

// A blank product used as the create-mode default. sizes starts as a map keyed by
// size (easier for the inputs); it's flattened into an array on submit.
const emptyForm = {
  name: '', description: '', brand: '', category: '', gender: 'Men',
  price: '', discountPrice: '', material: '', fit: '', care: '', SKU: '',
  tint: '#f2f1ef',
  colors: [],           // [{ name, hex }]
  images: [],           // [{ url, fileId }]
  featured: false, newArrival: false, bestSeller: false, isActive: true,
};

// Reusable labelled field wrapper for consistent spacing.
function Field({ label, required, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-medium">
        {label} {required && <span className="text-[#c0392b]">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-muted">{hint}</span>}
    </label>
  );
}

// White card section with a heading — the whole form is a stack of these.
function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-stone bg-white p-5 shadow-card lg:p-6">
      <h2 className="mb-4 text-[15px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  useSEO({ title: isEdit ? 'Edit Product' : 'New Product' });

  const [form, setForm] = useState(emptyForm);
  // Sizes are edited as a { size: stock } map, then flattened on submit.
  const [sizeMap, setSizeMap] = useState(() => Object.fromEntries(SIZES.map((s) => [s, 0])));
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  // Generic controlled-input setter.
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // Load categories (always) + the product being edited (edit mode only).
  const load = useCallback(async () => {
    try {
      const cats = await categoryApi.list();
      setCategories(Array.isArray(cats) ? cats : []);

      if (isEdit) {
        const { product } = await productApi.get(id);
        if (product) {
          setForm({
            name: product.name || '',
            description: product.description || '',
            brand: product.brand || '',
            category: product.category?._id || product.category || '',
            gender: product.gender || 'Men',
            price: product.price ?? '',
            discountPrice: product.discountPrice ?? '',
            material: product.material || '',
            fit: product.fit || '',
            care: product.care || '',
            SKU: product.SKU || '',
            tint: product.tint || '#f2f1ef',
            colors: product.colors || [],
            images: (product.images || []).map((im) => ({ url: im.url, fileId: im.fileId })),
            featured: !!product.featured,
            newArrival: !!product.newArrival,
            bestSeller: !!product.bestSeller,
            isActive: product.isActive !== false,
          });
          // Rehydrate the size stock map from the product's sizes array.
          const map = Object.fromEntries(SIZES.map((s) => [s, 0]));
          (product.sizes || []).forEach((s) => { if (s.size in map) map[s.size] = s.stock; });
          setSizeMap(map);
        }
      }
    } catch (err) {
      toast.error(err?.message || 'Could not load the form.');
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => { load(); }, [load]);

  // ── Colors (dynamic rows) ──
  const addColor = () => setForm((f) => ({ ...f, colors: [...f.colors, { name: '', hex: '#111111' }] }));
  const updateColor = (i, key, value) =>
    setForm((f) => ({ ...f, colors: f.colors.map((c, idx) => (idx === i ? { ...c, [key]: value } : c)) }));
  const removeColor = (i) => setForm((f) => ({ ...f, colors: f.colors.filter((_, idx) => idx !== i) }));

  // ── Images ──
  const onUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fd = new FormData();
    Array.from(files).forEach((file) => fd.append('images', file));
    setUploading(true);
    try {
      const res = await uploadApi.images(fd, '/richbayy/products');
      const uploaded = (res.images || []).map((im) => ({ url: im.url, fileId: im.fileId }));
      setForm((f) => ({ ...f, images: [...f.images, ...uploaded] }));
      toast.success(`${uploaded.length} image${uploaded.length === 1 ? '' : 's'} uploaded.`);
    } catch (err) {
      toast.error(err?.message || 'Image upload failed.');
    } finally {
      setUploading(false);
      e.target.value = ''; // allow re-uploading the same file
    }
  };

  const addUrlImage = () => {
    const url = urlInput.trim();
    if (!url) return;
    setForm((f) => ({ ...f, images: [...f.images, { url, fileId: '' }] }));
    setUrlInput('');
  };

  const removeImage = (i) => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));

  // ── Submit ──
  const onSubmit = async (e) => {
    e.preventDefault();

    // Required-field validation.
    if (!form.name.trim()) return toast.error('Product name is required.');
    if (!form.category) return toast.error('Please pick a category.');
    if (form.price === '' || Number(form.price) <= 0) return toast.error('A valid price is required.');

    // Flatten the size map → sizes[] (only sizes with stock > 0 are meaningful,
    // but we keep all so admins can zero-out a size explicitly).
    const sizes = SIZES.map((s) => ({ size: s, stock: Number(sizeMap[s]) || 0 })).filter((s) => s.stock > 0);

    const payload = {
      ...form,
      price: Number(form.price),
      discountPrice: form.discountPrice === '' ? undefined : Number(form.discountPrice),
      sizes,
      // Total stock is the sum of size stock — handy for the list/low-stock views.
      stock: sizes.reduce((sum, s) => sum + s.stock, 0),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await productApi.update(id, payload);
        toast.success('Product updated.');
      } else {
        await productApi.create(payload);
        toast.success('Product created.');
      }
      navigate('/admin/products');
    } catch (err) {
      toast.error(err?.message || 'Could not save the product.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-4xl">
      {/* ── Header row ── */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[0.3px] lg:text-[26px]">
            {isEdit ? 'Edit Product' : 'New Product'}
          </h1>
          <p className="mt-1 text-[13.5px] text-muted">
            {isEdit ? 'Update the details below and save your changes.' : 'Fill in the details to add a product to the catalogue.'}
          </p>
        </div>
        <Link to="/admin/products" className="btn-outline px-5 py-2.5 text-[12px]">Cancel</Link>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* ── Basic ── */}
        <Section title="Basic details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Name" required>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} className="field" placeholder="e.g. Oxford Linen Shirt" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Description">
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} className="field resize-y" placeholder="Describe the product…" />
              </Field>
            </div>
            <Field label="Brand">
              <input value={form.brand} onChange={(e) => set('brand', e.target.value)} className="field" placeholder="RICHBAYY" />
            </Field>
            <Field label="Category" required>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className="field">
                <option value="">Select a category…</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Gender">
              <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className="field">
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="SKU">
              <input value={form.SKU} onChange={(e) => set('SKU', e.target.value)} className="field" placeholder="RB-LIN-001" />
            </Field>
            <Field label="Material">
              <input value={form.material} onChange={(e) => set('material', e.target.value)} className="field" placeholder="100% Linen" />
            </Field>
            <Field label="Fit">
              <input value={form.fit} onChange={(e) => set('fit', e.target.value)} className="field" placeholder="Regular / Slim" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Care instructions">
                <input value={form.care} onChange={(e) => set('care', e.target.value)} className="field" placeholder="Machine wash cold, tumble dry low" />
              </Field>
            </div>
          </div>
        </Section>

        {/* ── Pricing ── */}
        <Section title="Pricing">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Price (₹)" required>
              <input type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} className="field" placeholder="1699" />
            </Field>
            <Field label="Discount price (₹)" hint="Optional — must be lower than price.">
              <input type="number" min="0" value={form.discountPrice} onChange={(e) => set('discountPrice', e.target.value)} className="field" placeholder="1299" />
            </Field>
          </div>
        </Section>

        {/* ── Tint ── */}
        <Section title="Card tint">
          <div className="flex items-center gap-4">
            <input type="color" value={form.tint} onChange={(e) => set('tint', e.target.value)} className="h-11 w-14 cursor-pointer rounded border border-stone bg-white p-1" />
            <input value={form.tint} onChange={(e) => set('tint', e.target.value)} className="field max-w-[160px]" placeholder="#f2f1ef" />
            <div className="h-11 flex-1 rounded-md border border-stone" style={{ background: form.tint }} title="Preview" />
          </div>
        </Section>

        {/* ── Colors ── */}
        <Section title="Colours">
          {form.colors.length === 0 && <p className="mb-3 text-[13px] text-muted">No colours added yet.</p>}
          <div className="space-y-3">
            {form.colors.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <input type="color" value={c.hex} onChange={(e) => updateColor(i, 'hex', e.target.value)} className="h-10 w-12 cursor-pointer rounded border border-stone bg-white p-1" />
                <input value={c.name} onChange={(e) => updateColor(i, 'name', e.target.value)} placeholder="Colour name (e.g. Sand)" className="field flex-1" />
                <input value={c.hex} onChange={(e) => updateColor(i, 'hex', e.target.value)} placeholder="#000000" className="field max-w-[130px]" />
                <button type="button" onClick={() => removeColor(i)} className="rounded-md border border-[#e2b8b2] px-3 py-2 text-[12px] font-medium text-[#c0392b] hover:bg-[#fdecea]">Remove</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addColor} className="mt-3 rounded-md border border-stone px-4 py-2 text-[12.5px] font-medium hover:bg-sand">＋ Add colour</button>
        </Section>

        {/* ── Sizes ── */}
        <Section title="Sizes & stock">
          <p className="mb-3 text-[12.5px] text-muted">Enter the available stock for each size. Sizes with 0 stock are ignored.</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {SIZES.map((s) => (
              <label key={s} className="block">
                <span className="mb-1.5 block text-center text-[12.5px] font-semibold">{s}</span>
                <input
                  type="number"
                  min="0"
                  value={sizeMap[s]}
                  onChange={(e) => setSizeMap((m) => ({ ...m, [s]: e.target.value }))}
                  className="field text-center"
                />
              </label>
            ))}
          </div>
        </Section>

        {/* ── Images ── */}
        <Section title="Images">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {/* Upload input */}
            <div className="flex-1">
              <span className="mb-1.5 block text-[12.5px] font-medium">Upload images</span>
              <input type="file" accept="image/*" multiple onChange={onUpload} disabled={uploading}
                className="block w-full text-[13px] text-muted file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-ink file:px-4 file:py-2.5 file:text-[12px] file:text-white hover:file:bg-[#2a2a2a] disabled:opacity-50" />
              {uploading && <span className="mt-1 block text-[12px] text-muted">Uploading…</span>}
            </div>
            {/* Paste-a-URL */}
            <div className="flex-1">
              <span className="mb-1.5 block text-[12.5px] font-medium">…or paste an image URL</span>
              <div className="flex gap-2">
                <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://…" className="field" />
                <button type="button" onClick={addUrlImage} className="btn-outline shrink-0 px-4 py-2.5 text-[12px]">Add</button>
              </div>
            </div>
          </div>

          {/* Thumbnails */}
          {form.images.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3">
              {form.images.map((im, i) => (
                <div key={i} className="group relative h-24 w-20 overflow-hidden rounded-md border border-stone bg-mist">
                  <img src={im.url} alt={`Product ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/80 text-[13px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Flags ── */}
        <Section title="Visibility & flags">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['featured', 'Featured'],
              ['newArrival', 'New Arrival'],
              ['bestSeller', 'Best Seller'],
              ['isActive', 'Active'],
            ].map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone px-4 py-3 text-[13.5px] hover:bg-sand">
                <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} className="h-4 w-4 accent-ink" />
                {label}
              </label>
            ))}
          </div>
        </Section>

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3 pb-4">
          <Link to="/admin/products" className="btn-outline px-6 py-3 text-[12px]">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-primary px-8 py-3 text-[12px]">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
