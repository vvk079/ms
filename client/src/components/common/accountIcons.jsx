// components/common/accountIcons.jsx
// Small helper returning the account-sidebar line icons by key (19px, stroke).
export const svgPaths = (key, size = 19) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (key) {
    case 'user': return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" /></svg>;
    case 'orders': return <svg {...p}><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v10l9 4 9-4V7" /><path d="M12 11v10" /></svg>;
    case 'heart': return <svg {...p}><path d="M12 20s-7-4.4-7-9.3C5 7.9 6.9 6 9.2 6c1.5 0 2.5.8 2.8 1.5C12.3 6.8 13.3 6 14.8 6 17.1 6 19 7.9 19 10.7 19 15.6 12 20 12 20z" /></svg>;
    case 'pin': return <svg {...p}><path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>;
    case 'settings': return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></svg>;
    case 'logout': return <svg {...p}><path d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>;
    default: return null;
  }
};
