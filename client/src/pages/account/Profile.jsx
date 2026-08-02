// pages/account/Profile.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The account overview. Renders INSIDE AccountLayout (sidebar + greeting header
// already supplied), so this file paints ONLY the inner content:
//
//   1. "Profile Information" card — read view with an inline edit form that
//      submits to userApi.updateProfile then patches the cached user.
//   2. "Change Password" card — currentPassword / newPassword / confirm →
//      authApi.changePassword.
//   3. "Recent Orders" card — the three most recent orders from orderApi.mine().
//   4. <ServiceFeatures /> strip at the bottom.
//
// NOTE: this file is one level deeper than top-level pages, so all shared imports
// climb two directories ('../../').
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import useSEO from '../../hooks/useSEO.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { userApi, authApi, orderApi } from '../../services/endpoints.js';
import { svgPaths } from '../../components/common/accountIcons.jsx';
import ServiceFeatures from '../../components/common/ServiceFeatures.jsx';
import { price, prettyDate } from '../../utils/format.js';

// ── Status → badge colour map (shared visual language across account pages) ──
// Returns Tailwind classes for the small pill used on order rows.
const statusBadge = (status) => {
  switch (status) {
    case 'Delivered': return 'bg-[#eafaf1] text-success';
    case 'Shipped': return 'bg-[#eaf1fb] text-[#2b6cb0]';
    case 'Cancelled': return 'bg-[#fdecea] text-[#c0392b]';
    // Placed / Processing (and anything else pending) → amber.
    default: return 'bg-[#fdf3e3] text-[#b7791f]';
  }
};

// A single labelled read-only field with a small leading icon.
function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-[#888]">{icon}</span>
      <div>
        <div className="text-[11.5px] uppercase tracking-[1px] text-muted">{label}</div>
        <div className="text-[14px] font-medium">{value || <span className="text-muted">Not set</span>}</div>
      </div>
    </div>
  );
}

export default function Profile() {
  useSEO({ title: 'My Profile', description: 'Manage your RICHBAYY profile, password and recent orders.' });

  const { user, patchUser } = useAuth();

  // Toggles the Profile Information card between read + edit modes.
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Recent orders (first three) for the summary card.
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // ── Profile edit form (defaults hydrated from the cached user) ──
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      dob: user?.dob ? String(user.dob).slice(0, 10) : '', // yyyy-mm-dd for <input type=date>
      gender: user?.gender || '',
    },
  });

  // ── Change-password form ──
  const {
    register: registerPass,
    handleSubmit: handlePassSubmit,
    watch: watchPass,
    reset: resetPass,
    formState: { errors: passErrors },
  } = useForm();
  const newPasswordValue = watchPass('newPassword');

  // Fetch the three most recent orders once.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await orderApi.mine();
        // The endpoint may return an array or { orders: [...] } — tolerate both.
        const list = Array.isArray(data) ? data : data?.orders || [];
        if (alive) setOrders(list.slice(0, 3));
      } catch {
        if (alive) setOrders([]);
      } finally {
        if (alive) setOrdersLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Open the edit form, re-seeding it from the freshest user data.
  const openEdit = () => {
    resetProfile({
      name: user?.name || '',
      email: user?.email || '',
      dob: user?.dob ? String(user.dob).slice(0, 10) : '',
      gender: user?.gender || '',
    });
    setEditing(true);
  };

  const onSaveProfile = async (values) => {
    setSavingProfile(true);
    try {
      const res = await userApi.updateProfile(values);
      // Endpoint may return the user directly or wrapped in { user }.
      const updated = res?.user || res;
      patchUser(updated);
      toast.success('Profile updated successfully.');
      setEditing(false);
    } catch (err) {
      toast.error(err?.message || 'Could not update your profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async ({ currentPassword, newPassword }) => {
    setSavingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully.');
      resetPass();
    } catch (err) {
      toast.error(err?.message || 'Could not change your password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── 1. Profile Information ─────────────────────────────── */}
      <section className="rounded-xl border border-stone bg-paper p-6 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold">Profile Information</h2>
          {!editing && (
            <button onClick={openEdit} className="btn-outline px-4 py-2 text-[12px]">Edit Profile</button>
          )}
        </div>

        {!editing ? (
          // ── Read view ──
          <div className="grid gap-5 sm:grid-cols-2">
            <InfoRow icon={svgPaths('user', 18)} label="Full Name" value={user?.name} />
            {/* Email icon (inline envelope) — email is read-only. */}
            <InfoRow
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
                </svg>
              }
              label="Email (optional)"
              value={user?.email || 'Not added'}
            />
            <InfoRow
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 5c0 8.5 6.5 15 15 15l1.5-3.5-4-1.5-2 2a12 12 0 01-5-5l2-2L9.5 3.5 6 5z" />
                </svg>
              }
              label="Phone (sign-in)"
              value={user?.phone}
            />
            <InfoRow
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" />
                </svg>
              }
              label="Date of Birth"
              value={user?.dob ? prettyDate(user.dob) : ''}
            />
            <InfoRow icon={svgPaths('settings', 18)} label="Gender" value={user?.gender} />
          </div>
        ) : (
          // ── Edit form ──
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleProfileSubmit(onSaveProfile)}
            className="grid gap-4 sm:grid-cols-2"
            noValidate
          >
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Full Name</label>
              <input
                className="field"
                {...registerProfile('name', { required: 'Name is required' })}
              />
              {profileErrors.name && <p className="mt-1 text-[12px] text-[#c0392b]">{profileErrors.name.message}</p>}
            </div>

            {/* Phone is the sign-in identifier — changing it would move the whole
                account, so it's locked here and would need a fresh OTP. */}
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Phone (sign-in number)</label>
              <input className="field cursor-not-allowed bg-mist text-muted" value={user?.phone || ''} readOnly />
              <p className="mt-1 text-[12px] text-muted">
                This is the number you sign in with. Contact support to change it.
              </p>
            </div>

            {/* Email is optional — purely for order updates and receipts. */}
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">
                Email <span className="text-muted">(optional)</span>
              </label>
              <input
                type="email"
                className="field"
                placeholder="you@example.com"
                {...registerProfile('email', {
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                })}
              />
              {profileErrors.email && <p className="mt-1 text-[12px] text-[#c0392b]">{profileErrors.email.message}</p>}
              <p className="mt-1 text-[12px] text-muted">Used for order updates — never for signing in.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Date of Birth</label>
              <input type="date" className="field" {...registerProfile('dob')} />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Gender</label>
              <select className="field" {...registerProfile('gender')}>
                <option value="">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex items-center gap-3 sm:col-span-2">
              <button type="submit" disabled={savingProfile} className="btn-primary">
                {savingProfile ? 'Saving…' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="btn-outline">Cancel</button>
            </div>
          </motion.form>
        )}
      </section>

      {/* ── 2. Change Password ─────────────────────────────────────
          Only meaningful for staff accounts. Customers sign in with a one-time
          code, so there is no password for them to change. */}
      {user?.hasPassword && (
      <section className="rounded-xl border border-stone bg-paper p-6 shadow-card">
        <h2 className="mb-5 text-[16px] font-semibold">Change Password</h2>
        <form onSubmit={handlePassSubmit(onChangePassword)} className="grid gap-4 sm:grid-cols-3" noValidate>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">Current Password</label>
            <input
              type="password"
              autoComplete="current-password"
              className="field"
              {...registerPass('currentPassword', { required: 'Required' })}
            />
            {passErrors.currentPassword && <p className="mt-1 text-[12px] text-[#c0392b]">{passErrors.currentPassword.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium">New Password</label>
            <input
              type="password"
              autoComplete="new-password"
              className="field"
              {...registerPass('newPassword', {
                required: 'Required',
                minLength: { value: 6, message: 'Min 6 characters' },
              })}
            />
            {passErrors.newPassword && <p className="mt-1 text-[12px] text-[#c0392b]">{passErrors.newPassword.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium">Confirm Password</label>
            <input
              type="password"
              autoComplete="new-password"
              className="field"
              {...registerPass('confirmPassword', {
                required: 'Required',
                validate: (v) => v === newPasswordValue || 'Passwords do not match',
              })}
            />
            {passErrors.confirmPassword && <p className="mt-1 text-[12px] text-[#c0392b]">{passErrors.confirmPassword.message}</p>}
          </div>

          <div className="sm:col-span-3">
            <button type="submit" disabled={savingPassword} className="btn-primary">
              {savingPassword ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>
      )}

      {/* ── 3. Recent Orders ───────────────────────────────────── */}
      <section className="rounded-xl border border-stone bg-paper p-6 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold">Recent Orders</h2>
          <Link to="/account/orders" className="text-[13px] font-medium text-ink underline">View All Orders →</Link>
        </div>

        {ordersLoading ? (
          // Lightweight skeleton rows while orders load.
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-mist" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone bg-sand px-5 py-8 text-center text-[13.5px] text-muted">
            You haven&apos;t placed any orders yet.{' '}
            <Link to="/shop" className="font-semibold text-ink underline">Start shopping →</Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => {
              const first = o.items?.[0];
              return (
                <li key={o._id}>
                  <Link
                    to="/account/orders"
                    className="flex items-center gap-4 rounded-lg border border-stone p-3 transition-colors hover:bg-sand"
                  >
                    {/* Thumb (image or tinted placeholder) */}
                    <div className="h-14 w-12 shrink-0 overflow-hidden rounded bg-mist">
                      {first?.image && <img src={first.image} alt={first.name} className="h-full w-full object-cover" loading="lazy" />}
                    </div>
                    {/* Name + meta */}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-medium">
                        {first?.name || 'Order'}{o.items?.length > 1 ? ` +${o.items.length - 1} more` : ''}
                      </div>
                      <div className="text-[12px] text-muted">
                        {o.orderNumber} · {prettyDate(o.createdAt)}
                      </div>
                    </div>
                    {/* Status + total */}
                    <div className="text-right">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadge(o.status)}`}>
                        {o.status}
                      </span>
                      <div className="mt-1 text-[13px] font-semibold">{price(o.total)}</div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── 4. Service features strip ──────────────────────────── */}
      <ServiceFeatures />
    </div>
  );
}
