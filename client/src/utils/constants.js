// utils/constants.js — brand-wide constants pulled from the RICHBAYY template.

export const BRAND = 'RICHBAYY';
export const TAGLINE = 'PREMIUM SHIRTS';
export const ANNOUNCEMENT = 'Free shipping on all orders above ₹1499';
export const FREE_SHIP_THRESHOLD = 1499;
export const SHIP_FEE = 99;

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// RICHBAYY measurement chart (inches). Keyed by our size codes — XXL is labelled
// "2XL" on the official chart. XS has no published measurements.
export const MEASUREMENT_ROWS = ['Front Length', 'Chest', 'Waist', 'Bottom', 'Shoulder', 'Armhole', 'Sleeve Length'];
export const MEASUREMENTS = {
  S:   { 'Front Length': 27.5, Chest: 19, Waist: 18.5, Bottom: 19, Shoulder: 17.5, Armhole: 10,   'Sleeve Length': 24.5 },
  M:   { 'Front Length': 28,   Chest: 20, Waist: 19.5, Bottom: 20, Shoulder: 18,   Armhole: 10.5, 'Sleeve Length': 25 },
  L:   { 'Front Length': 28.5, Chest: 21, Waist: 20.5, Bottom: 21, Shoulder: 18.5, Armhole: 11,   'Sleeve Length': 25.5 },
  XL:  { 'Front Length': 29,   Chest: 22, Waist: 21.5, Bottom: 22, Shoulder: 19,   Armhole: 11.5, 'Sleeve Length': 26 },
  XXL: { 'Front Length': 29.5, Chest: 23, Waist: 22.5, Bottom: 23, Shoulder: 20,   Armhole: 12,   'Sleeve Length': 26.5 },
};

// Payment badges shown in header/footer/PDP.
export const PAYMENTS = ['VISA', 'mastercard', 'RuPay', 'UPI'];

// Primary navigation (mirrors the template header).
export const NAV = [
  { label: 'SHOP', to: '/shop', caret: true },
  { label: 'NEW ARRIVALS', to: '/shop?filter=newArrival' },
  { label: 'BEST SELLERS', to: '/shop?filter=bestSeller' },
  { label: 'LINEN EDIT', to: '/category/linen-shirts' },
  { label: 'COLLECTIONS', to: '/shop', caret: true },
  { label: 'ABOUT US', to: '/about' },
];

// Footer link columns.
export const FOOTER_COLS = [
  { title: 'SHOP', links: [['All Shirts', '/shop'], ['New Arrivals', '/shop?filter=newArrival'], ['Best Sellers', '/shop?filter=bestSeller'], ['Linen Edit', '/category/linen-shirts'], ['Collections', '/shop']] },
  { title: 'HELP', links: [['Track Order', '/track'], ['Returns & Exchanges', '/about'], ['Shipping Policy', '/about'], ['FAQs', '/about'], ['Contact Us', '/about']] },
  { title: 'COMPANY', links: [['About Us', '/about'], ['Our Story', '/about'], ['Careers', '/about'], ['Store Locator', '/about'], ['Press', '/about']] },
];

// Service feature strip (icons rendered inline in the component).
export const SERVICE_FEATURES = [
  { key: 'ship', title: 'Free Shipping', desc: 'On orders above ₹1499' },
  { key: 'returns', title: 'Easy Returns', desc: '7-day return policy' },
  { key: 'secure', title: 'Secure Payments', desc: '100% secure checkout' },
  { key: 'support', title: 'Customer Support', desc: "We're here to help" },
];
