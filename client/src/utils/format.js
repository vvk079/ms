// utils/format.js — small formatting helpers used across the UI.

// Indian rupee formatting with grouping (e.g. 1699 → "1,699").
export const inr = (n) => Number(n || 0).toLocaleString('en-IN');

// "₹1,699"
export const price = (n) => `₹${inr(Math.round(n || 0))}`;

// Discount percentage between original & selling price.
export const discountPct = (original, selling) => {
  if (!original || original <= selling) return 0;
  return Math.round(((original - selling) / original) * 100);
};

// Effective price given a product (discount if valid, else base price).
export const effectivePrice = (p) =>
  p?.discountPrice && p.discountPrice < p.price ? p.discountPrice : p?.price || 0;

// Friendly date "12 May 2024".
export const prettyDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// Delivery estimate: 2–4 working days from now.
export const deliveryEstimate = () => {
  const start = new Date();
  start.setDate(start.getDate() + 2);
  const end = new Date();
  end.setDate(end.getDate() + 4);
  const fmt = (x) => x.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${fmt(start)} – ${fmt(end)}`;
};
