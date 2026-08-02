// components/layout/Navbar.jsx
// Sticky header from the template: wordmark left, centred nav (desktop), and
// search/account/wishlist/cart icons right with a live cart badge. Collapses to
// a slide-in drawer on mobile. Includes an expandable search field.
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SearchIcon, UserIcon, HeartIcon, BagIcon, CaretDown } from '../common/Icons.jsx';
import { BRAND, NAV } from '../../utils/constants.js';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Navbar() {
  const navigate = useNavigate();
  const { count } = useCart();
  const { count: wishCount } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');

  const submitSearch = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/shop?keyword=${encodeURIComponent(q.trim())}`);
    setSearchOpen(false);
    setDrawer(false);
    setQ('');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-stone bg-paper">
      <div className="flex items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        {/* Wordmark */}
        <Link to="/" className="text-[22px] font-semibold tracking-brand sm:text-[24px]">
          {BRAND}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 text-[14px] tracking-[0.6px] lg:flex xl:gap-10">
          {NAV.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `relative inline-flex items-center gap-1.5 pb-1 text-[#222] transition-colors hover:text-black ${
                  isActive ? 'font-medium' : ''
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span>{item.label}</span>
                  {item.caret && <CaretDown />}
                  {isActive && <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-ink" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-4 sm:gap-5">
          <button aria-label="Search" onClick={() => setSearchOpen((s) => !s)} className="hidden sm:block">
            <SearchIcon />
          </button>
          <Link to={isAuthenticated ? '/account/profile' : '/login'} aria-label="Account" className="hidden sm:block">
            <UserIcon />
          </Link>
          <Link to="/wishlist" aria-label="Wishlist" className="relative hidden sm:block">
            <HeartIcon />
            {wishCount > 0 && <Badge>{wishCount}</Badge>}
          </Link>
          <Link to="/cart" aria-label="Cart" className="relative">
            <BagIcon />
            {count > 0 && <Badge>{count}</Badge>}
          </Link>
          {/* Mobile hamburger */}
          <button aria-label="Menu" className="lg:hidden" onClick={() => setDrawer(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="#111" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>

      {/* Expandable search (desktop) */}
      <AnimatePresence>
        {searchOpen && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={submitSearch}
            className="overflow-hidden border-t border-stone"
          >
            <div className="flex items-center gap-3 px-5 py-3 sm:px-10">
              <SearchIcon />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search shirts, colours, styles…"
                className="w-full bg-transparent text-[15px] outline-none"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="text-[13px] text-muted">Close</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
              className="fixed inset-0 z-50 bg-black/40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: [0.22, 0.61, 0.36, 1], duration: 0.35 }}
              className="fixed right-0 top-0 z-50 flex h-full w-[82%] max-w-sm flex-col bg-paper p-6 lg:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="text-[20px] font-semibold tracking-brand">{BRAND}</span>
                <button onClick={() => setDrawer(false)} aria-label="Close">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#111" strokeWidth="1.6" strokeLinecap="round" /></svg>
                </button>
              </div>
              <form onSubmit={submitSearch} className="mb-5 flex items-center gap-2 rounded-md border border-[#ddd] px-3 py-2.5">
                <SearchIcon size={18} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full bg-transparent text-[14px] outline-none" />
              </form>
              <nav className="flex flex-col gap-1">
                {NAV.map((item) => (
                  <Link key={item.label} to={item.to} onClick={() => setDrawer(false)} className="border-b border-[#f2f2f2] py-3 text-[15px] tracking-[0.5px]">
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-3 pt-6 text-[15px]">
                <Link to={isAuthenticated ? '/account/profile' : '/login'} onClick={() => setDrawer(false)} className="flex items-center gap-3"><UserIcon size={18} /> {isAuthenticated ? 'My Account' : 'Sign In'}</Link>
                <Link to="/wishlist" onClick={() => setDrawer(false)} className="flex items-center gap-3"><HeartIcon size={18} /> Wishlist ({wishCount})</Link>
                <Link to="/track" onClick={() => setDrawer(false)} className="flex items-center gap-3">Track Order</Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

// Small circular count badge.
const Badge = ({ children }) => (
  <span className="absolute -right-2 -top-[7px] flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[10px] font-medium text-white">
    {children}
  </span>
);
