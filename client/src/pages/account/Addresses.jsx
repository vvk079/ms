// pages/account/Addresses.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The saved-address book. Renders INSIDE AccountLayout, so this file paints ONLY
// the inner content (heading + "Add Address" button + address cards).
//
//   • userApi.addresses() → list rendered as cards (label chip, default badge,
//     name, full address, phone) with Edit / Delete / "Set as default" actions.
//   • Add/Edit uses a modal form (label, fullName, phone, line1, line2, city,
//     state, pincode) → userApi.addAddress / updateAddress.
//   • Delete → deleteAddress; Set default → updateAddress(id, { isDefault:true }).
//   • The list is refreshed after every mutation; each action toasts.
//   • Empty state when there are no addresses.
//
// One level deeper than top-level pages → shared imports climb two dirs ('../../').
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import useSEO from '../../hooks/useSEO.js';
import { userApi } from '../../services/endpoints.js';
import { svgPaths } from '../../components/common/accountIcons.jsx';

// Empty form values used when opening the "Add" modal.
const BLANK = { label: 'Home', fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' };

export default function Addresses() {
  useSEO({ title: 'My Addresses', description: 'Manage your saved shipping addresses for faster RICHBAYY checkout.' });

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state: null = closed; otherwise holds the address being edited (or a
  // blank object for a new one). `editingId` distinguishes add vs update.
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null); // per-card action in progress

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: BLANK });

  // Load (or reload) the address list. Reused after every mutation.
  const load = useCallback(async () => {
    try {
      const data = await userApi.addresses();
      const list = Array.isArray(data) ? data : data?.addresses || [];
      setAddresses(list);
    } catch (err) {
      toast.error(err?.message || 'Could not load your addresses.');
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Open the modal in "add" mode.
  const openAdd = () => {
    setEditingId(null);
    reset(BLANK);
    setModalOpen(true);
  };

  // Open the modal in "edit" mode, seeded from the chosen address.
  const openEdit = (addr) => {
    setEditingId(addr._id);
    reset({
      label: addr.label || 'Home',
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      line1: addr.line1 || '',
      line2: addr.line2 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingId(null); };

  // Save handler — creates or updates depending on editingId.
  const onSave = async (values) => {
    setSaving(true);
    try {
      if (editingId) {
        await userApi.updateAddress(editingId, values);
        toast.success('Address updated.');
      } else {
        await userApi.addAddress(values);
        toast.success('Address added.');
      }
      closeModal();
      await load();
    } catch (err) {
      toast.error(err?.message || 'Could not save the address.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    setBusyId(id);
    try {
      await userApi.deleteAddress(id);
      toast.success('Address removed.');
      await load();
    } catch (err) {
      toast.error(err?.message || 'Could not delete the address.');
    } finally {
      setBusyId(null);
    }
  };

  const onSetDefault = async (id) => {
    setBusyId(id);
    try {
      await userApi.updateAddress(id, { isDefault: true });
      toast.success('Default address updated.');
      await load();
    } catch (err) {
      toast.error(err?.message || 'Could not set default address.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {/* ── Heading + Add button ── */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="heading text-[20px]">My Addresses</h1>
        <button onClick={openAdd} className="btn-primary px-5 py-2.5 text-[12px]">+ Add Address</button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-mist" />)}
        </div>
      ) : addresses.length === 0 ? (
        // ── Empty state ──
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone bg-sand py-16 text-center">
          <div className="mb-3 text-[#999]">{svgPaths('pin', 40)}</div>
          <h3 className="mb-1 text-[18px] font-semibold">No saved addresses</h3>
          <p className="mb-6 max-w-sm text-[13.5px] text-muted">
            Add an address to check out faster next time.
          </p>
          <button onClick={openAdd} className="btn-primary">Add Your First Address</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <motion.div
              key={a._id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col rounded-xl border border-stone bg-paper p-5 shadow-card"
            >
              {/* Label chip + default badge */}
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.5px]">
                  {a.label || 'Address'}
                </span>
                {a.isDefault && (
                  <span className="rounded-full bg-[#eafaf1] px-2.5 py-1 text-[11px] font-semibold text-success">
                    Default
                  </span>
                )}
              </div>

              {/* Name + full address + phone */}
              <div className="flex-1 text-[13.5px] leading-relaxed">
                <div className="font-semibold">{a.fullName}</div>
                <div className="text-muted">
                  {a.line1}{a.line2 ? `, ${a.line2}` : ''}
                </div>
                <div className="text-muted">
                  {a.city}, {a.state} — {a.pincode}
                </div>
                {a.country && <div className="text-muted">{a.country}</div>}
                <div className="mt-1 text-muted">Phone: {a.phone}</div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-stone pt-3 text-[12.5px]">
                <button onClick={() => openEdit(a)} className="font-medium text-ink underline">Edit</button>
                <button
                  onClick={() => onDelete(a._id)}
                  disabled={busyId === a._id}
                  className="font-medium text-[#c0392b] underline disabled:opacity-50"
                >
                  Delete
                </button>
                {!a.isDefault && (
                  <button
                    onClick={() => onSetDefault(a._id)}
                    disabled={busyId === a._id}
                    className="ml-auto font-medium text-muted underline hover:text-ink disabled:opacity-50"
                  >
                    Set as default
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Add / Edit modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-paper p-6 shadow-lift sm:p-8"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-[18px] font-semibold">{editingId ? 'Edit Address' : 'Add New Address'}</h2>
                <button onClick={closeModal} aria-label="Close" className="text-[22px] leading-none text-muted hover:text-ink">×</button>
              </div>

              <form onSubmit={handleSubmit(onSave)} className="grid gap-4 sm:grid-cols-2" noValidate>
                {/* Label */}
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium">Label</label>
                  <select className="field" {...register('label', { required: true })}>
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Full name */}
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium">Full Name</label>
                  <input className="field" {...register('fullName', { required: 'Name is required' })} />
                  {errors.fullName && <p className="mt-1 text-[12px] text-[#c0392b]">{errors.fullName.message}</p>}
                </div>

                {/* Phone */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[13px] font-medium">Phone</label>
                  <input
                    className="field"
                    placeholder="10-digit mobile number"
                    {...register('phone', {
                      required: 'Phone is required',
                      pattern: { value: /^[0-9+\-\s]{7,15}$/, message: 'Enter a valid phone number' },
                    })}
                  />
                  {errors.phone && <p className="mt-1 text-[12px] text-[#c0392b]">{errors.phone.message}</p>}
                </div>

                {/* Address line 1 */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[13px] font-medium">Address Line 1</label>
                  <input className="field" placeholder="House no., building, street" {...register('line1', { required: 'Address is required' })} />
                  {errors.line1 && <p className="mt-1 text-[12px] text-[#c0392b]">{errors.line1.message}</p>}
                </div>

                {/* Address line 2 (optional) */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[13px] font-medium">Address Line 2 <span className="text-muted">(optional)</span></label>
                  <input className="field" placeholder="Area, landmark" {...register('line2')} />
                </div>

                {/* City */}
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium">City</label>
                  <input className="field" {...register('city', { required: 'City is required' })} />
                  {errors.city && <p className="mt-1 text-[12px] text-[#c0392b]">{errors.city.message}</p>}
                </div>

                {/* State */}
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium">State</label>
                  <input className="field" {...register('state', { required: 'State is required' })} />
                  {errors.state && <p className="mt-1 text-[12px] text-[#c0392b]">{errors.state.message}</p>}
                </div>

                {/* Pincode */}
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium">Pincode</label>
                  <input
                    className="field"
                    {...register('pincode', {
                      required: 'Pincode is required',
                      pattern: { value: /^[0-9]{4,10}$/, message: 'Enter a valid pincode' },
                    })}
                  />
                  {errors.pincode && <p className="mt-1 text-[12px] text-[#c0392b]">{errors.pincode.message}</p>}
                </div>

                {/* Actions */}
                <div className="mt-2 flex items-center gap-3 sm:col-span-2">
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Address'}
                  </button>
                  <button type="button" onClick={closeModal} className="btn-outline">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
