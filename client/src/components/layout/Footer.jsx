// components/layout/Footer.jsx
// Full footer from the template: brand blurb + socials, three link columns, a
// newsletter capture, and a bottom bar with copyright + payment badges.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SocialIcon } from '../common/Icons.jsx';
import { BRAND, FOOTER_COLS, PAYMENTS } from '../../utils/constants.js';

export default function Footer() {
  const [email, setEmail] = useState('');

  const subscribe = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error('Enter a valid email');
    toast.success('Subscribed! Watch your inbox for new drops.');
    setEmail('');
  };

  return (
    <footer className="border-t border-stone bg-paper">
      <div className="grid gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1.4fr] lg:gap-8 lg:px-10">
        {/* Brand */}
        <div>
          <div className="mb-3.5 text-[22px] font-semibold tracking-brand">{BRAND}</div>
          <p className="mb-4 text-[13.5px] leading-relaxed text-[#555]">
            Timeless shirts. Premium fabrics.<br />Made for the modern man.
          </p>
          <div className="flex gap-4 text-[#333]">
            {['instagram', 'facebook', 'twitter', 'telegram'].map((s) => (
              <a key={s} href="#" aria-label={s} className="transition-colors hover:text-ink"><SocialIcon name={s} /></a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {FOOTER_COLS.map((col) => (
          <div key={col.title}>
            <div className="mb-4 text-[13px] font-semibold tracking-[0.8px]">{col.title}</div>
            <div className="flex flex-col gap-2.5">
              {col.links.map(([label, to]) => (
                <Link key={label} to={to} className="text-[13.5px] text-[#666] hover:text-ink">{label}</Link>
              ))}
            </div>
          </div>
        ))}

        {/* Newsletter */}
        <div>
          <div className="mb-4 text-[13px] font-semibold tracking-[0.8px]">NEWSLETTER</div>
          <p className="mb-4 text-[13.5px] leading-snug text-[#666]">
            Subscribe to get updates on<br />new arrivals and offers.
          </p>
          <form onSubmit={subscribe} className="flex">
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 border border-r-0 border-[#ddd] px-3 py-2.5 text-[13px] outline-none focus:border-ink"
            />
            <button className="w-11 bg-ink text-[16px] text-white transition-colors hover:bg-[#2a2a2a]">→</button>
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-stone px-5 py-5 sm:flex-row sm:px-10">
        <div className="text-[12.5px] text-[#888]">© {new Date().getFullYear()} {BRAND}. All rights reserved.</div>
        <div className="flex items-center gap-5">
          {PAYMENTS.map((p) => (
            <span key={p} className="text-[14px] font-bold italic tracking-[0.3px] text-[#555]">{p}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}
