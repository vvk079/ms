// layouts/AccountLayout.jsx
// Two-column account dashboard (sidebar + routed content), matching the
// template's Profile page. Sidebar links map to /account/* routes.
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { svgPaths } from '../components/common/accountIcons.jsx';

const LINKS = [
  { to: '/account/profile', label: 'My Profile', icon: 'user' },
  { to: '/account/orders', label: 'My Orders', icon: 'orders' },
  { to: '/wishlist', label: 'Wishlist', icon: 'heart' },
  { to: '/account/addresses', label: 'Addresses', icon: 'pin' },
];

export default function AccountLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="grid gap-9 px-5 py-10 sm:px-8 lg:grid-cols-[260px_1fr] lg:px-10">
      <aside>
        <div className="flex flex-col gap-1">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg border-l-[3px] px-3.5 py-3 text-[14px] transition-colors ${
                  isActive ? 'border-ink bg-[#f5f4f1] font-semibold' : 'border-transparent hover:bg-sand'
                }`
              }
            >
              <span className="text-[#333]">{svgPaths(l.icon)}</span>
              <span>{l.label}</span>
            </NavLink>
          ))}
          <button onClick={onLogout} className="flex items-center gap-3 rounded-lg border-l-[3px] border-transparent px-3.5 py-3 text-left text-[14px] text-[#c0392b] transition-colors hover:bg-[#fce8e8]">
            <span>{svgPaths('logout')}</span> Logout
          </button>
        </div>

        {/* Help card */}
        <div className="mt-6 rounded-[10px] border border-[#eee] p-5">
          <div className="text-[14px] font-semibold">Need Help?</div>
          <div className="mb-2.5 mt-0.5 text-[12.5px] text-[#888]">We're here for you</div>
          <a href="/about" className="text-[13px] underline">Contact Support →</a>
        </div>
      </aside>

      <main>
        {/* Greeting */}
        <div className="mb-6">
          <p className="text-[13px] tracking-[1px] text-muted">WELCOME BACK</p>
          <h1 className="text-[26px] font-semibold">{user?.name}</h1>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
