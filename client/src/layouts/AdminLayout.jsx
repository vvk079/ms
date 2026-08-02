// layouts/AdminLayout.jsx
// Admin shell: a dark, fixed sidebar (brand + nav) and a light content area.
// Guarded upstream by <ProtectedRoute adminOnly>.
import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { BRAND } from '../utils/constants.js';

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true, icon: 'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10' },
  { to: '/admin/products', label: 'Products', icon: 'M20 7l-8-4-8 4 8 4 8-4zM4 7v10l8 4 8-4V7' },
  { to: '/admin/categories', label: 'Categories', icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
  { to: '/admin/orders', label: 'Orders', icon: 'M6 2l1.5 3h9L18 2M3 6h18l-2 14H5L3 6z' },
  { to: '/admin/customers', label: 'Customers', icon: 'M9 11a4 4 0 100-8 4 4 0 000 8zM3 21c0-3.5 3-6 6-6M16 11a3 3 0 100-6M21 21c0-2.5-2-4.5-4.5-5' },
  { to: '/admin/coupons', label: 'Coupons', icon: 'M4 8V6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 000-4zM12 6v12' },
  { to: '/admin/sales-report', label: 'Sales Report', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const onLogout = async () => { await logout(); navigate('/'); };

  const NavItems = () => NAV.map((n) => (
    <NavLink
      key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-4 py-3 text-[14px] transition-colors ${
          isActive ? 'bg-white/10 font-medium text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={n.icon} /></svg>
      {n.label}
    </NavLink>
  ));

  return (
    <div className="flex min-h-screen bg-[#f6f6f4]">
      {/* Sidebar (desktop) */}
      <aside className="fixed hidden h-screen w-60 flex-col bg-ink p-5 lg:flex">
        <Link to="/" className="mb-8 px-2 text-[22px] font-semibold tracking-brand text-white">{BRAND}</Link>
        <nav className="flex flex-1 flex-col gap-1"><NavItems /></nav>
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="px-2 text-[13px] text-white/60">{user?.name}</div>
          <button onClick={onLogout} className="mt-2 w-full rounded-lg px-4 py-2.5 text-left text-[13px] text-white/70 hover:bg-white/5 hover:text-white">Logout</button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between bg-ink px-4 py-3 lg:hidden">
        <Link to="/" className="text-[19px] font-semibold tracking-brand text-white">{BRAND}</Link>
        <button onClick={() => setOpen((o) => !o)} aria-label="Menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg></button>
      </div>
      {open && (
        <div className="fixed inset-0 top-[52px] z-40 bg-ink p-5 lg:hidden">
          <nav className="flex flex-col gap-1"><NavItems /></nav>
          <button onClick={onLogout} className="mt-4 w-full rounded-lg px-4 py-2.5 text-left text-[13px] text-white/70">Logout</button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 lg:ml-60">
        <div className="px-5 pb-16 pt-[68px] sm:px-8 lg:px-10 lg:pt-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
