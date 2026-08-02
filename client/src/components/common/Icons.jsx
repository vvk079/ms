// components/common/Icons.jsx
// Central inline-SVG icon set. Paths are lifted from the RICHBAYY template so the
// storefront matches pixel-for-pixel. Each icon accepts size/stroke/fill props.
const base = (size = 20) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none' });

export const SearchIcon = ({ size = 20, color = '#111' }) => (
  <svg {...base(size)}><circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5" /><path d="M16.5 16.5L21 21" stroke={color} strokeWidth="1.5" /></svg>
);

export const UserIcon = ({ size = 20, color = '#111' }) => (
  <svg {...base(size)}><circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5" /><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" stroke={color} strokeWidth="1.5" /></svg>
);

export const HeartIcon = ({ size = 20, color = '#111', fill = 'none' }) => (
  <svg {...base(size)}><path d="M12 20s-7-4.4-7-9.3C5 7.9 6.9 6 9.2 6c1.5 0 2.5.8 2.8 1.5C12.3 6.8 13.3 6 14.8 6 17.1 6 19 7.9 19 10.7 19 15.6 12 20 12 20z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={fill} /></svg>
);

export const BagIcon = ({ size = 20, color = '#111' }) => (
  <svg {...base(size)}><path d="M6 8h12l-1 12H7L6 8z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" /><path d="M9 8V6.5C9 4.6 10.3 3.5 12 3.5S15 4.6 15 6.5V8" stroke={color} strokeWidth="1.5" /></svg>
);

export const StarIcon = ({ size = 15, color = '#e8b33a' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2l2.9 6.2 6.8.6-5.1 4.5 1.5 6.6L12 17l-6 3.4 1.5-6.6L2.4 8.8l6.8-.6z" /></svg>
);

export const CaretDown = ({ size = 9, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill="none"><path d="M1 3l4 4 4-4" stroke={color} strokeWidth="1.2" /></svg>
);

export const CheckIcon = ({ size = 16, color = '#2e8b57' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke={color} strokeWidth="2" /></svg>
);

export const CheckCircle = ({ size = 16, color = '#2e8b57' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6" /><path d="M8 12l3 3 5-6" stroke={color} strokeWidth="1.6" fill="none" /></svg>
);

export const ArrowRight = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

// Feature-strip icons (26px, ink stroke) — keyed for easy mapping.
const strokeProps = (size = 26) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: '#111', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' });
export const FeatureIcon = ({ name, size = 24 }) => {
  const p = { ...strokeProps(size) };
  switch (name) {
    case 'fabric': return <svg {...p}><path d="M12 2C8 6 8 9 12 12c4-3 4-6 0-10z" /><path d="M12 12v10" /></svg>;
    case 'fit': return <svg {...p}><path d="M8 4l4 3 4-3 4 4-3 3v9H7v-9L4 8z" /></svg>;
    case 'ship': return <svg {...p}><rect x="1" y="6" width="13" height="10" rx="1" /><path d="M14 9h4l3 3v4h-7z" /><circle cx="6" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></svg>;
    case 'returns': return <svg {...p}><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v10l9 4 9-4V7" /></svg>;
    case 'secure': return <svg {...p}><path d="M12 2l8 3v6c0 5-3.5 8-8 11-4.5-3-8-6-8-11V5z" /></svg>;
    case 'support': return <svg {...p}><path d="M4 13v-1a8 8 0 0116 0v1" /><path d="M4 14a2 2 0 012 2v1a2 2 0 01-2 2 1 1 0 01-1-1v-3a1 1 0 011-1z" /><path d="M20 14a2 2 0 00-2 2v1a2 2 0 002 2 1 1 0 001-1v-3a1 1 0 00-1-1z" /></svg>;
    default: return null;
  }
};

// Social icons for the footer.
export const SocialIcon = ({ name, size = 18 }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'instagram': return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" /></svg>;
    case 'facebook': return <svg {...p}><path d="M15 3h-2.5C10.5 3 9 4.5 9 6.5V9H6.5v3H9v9h3v-9h2.5l.5-3H12V6.8c0-.6.4-.8.9-.8H15z" /></svg>;
    case 'twitter': return <svg {...p}><path d="M22 4c-1 .5-2 .8-3 1a4 4 0 00-7 3v1A9 9 0 013 4s-4 9 5 13a10 10 0 01-6 2c9 5 20 0 20-11.5 0-.3 0-.6-.1-.8A6 6 0 0022 4z" /></svg>;
    default: return <svg {...p}><path d="M12 3c-2.5 0-4 2-4 4v10l4-2 4 2V7c0-2-1.5-4-4-4z" /></svg>;
  }
};
