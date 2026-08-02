// utils/seedData.js
// Static catalogue used by the seed script. Currently a single live product
// (Navy Blue Solid); other demo products were removed on request.

// Category name → tint (fallback tile bg) taken from the design's "Shop by Category".
export const categories = [
  { name: 'Solid Shirts', tint: '#cabfae', description: 'Clean, versatile solids for every day.' },
  { name: 'Striped Shirts', tint: '#d0c6b6', description: 'Refined stripes with a modern edge.' },
  { name: 'Check Shirts', tint: '#b9beb8', description: 'Timeless checks, effortlessly styled.' },
  { name: 'Linen Shirts', tint: '#b7b4ad', description: 'Light, breathable linen for warm days.' },
  { name: 'Printed Shirts', tint: '#b4b19f', description: 'Statement prints, crafted subtly.' },
  { name: 'Oversized Shirts', tint: '#8f9295', description: 'Relaxed silhouettes with premium drape.' },
];

// A reusable Unsplash shirt gallery (used by the promo banners below).
const IMG = {
  blue: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900&q=80',
  linen: 'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=900&q=80',
  olive: 'https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=900&q=80',
};

// Product list.
export const products = [
  {
    name: 'Navy Blue Solid', category: 'Solid Shirts', price: 1299, discountPrice: 799, tint: '#d6d7d9',
    material: '100% Cotton', bestSeller: true, featured: true, newArrival: true,
    colors: [{ name: 'Navy Blue', hex: '#1c2433' }],
    images: ['/products/navy-1.png', '/products/navy-2.png', '/products/navy-3.png', '/products/navy-4.png'],
    description: 'A wardrobe-defining navy blue solid shirt in pure cotton. Clean lines, a comfortable regular fit and a deep, versatile navy tone that pairs effortlessly with denim or tailored trousers.',
  },
  {
    name: 'Black Plain Shirt', category: 'Solid Shirts', price: 1299, discountPrice: 799, tint: '#d6d7d9',
    material: '100% Cotton', bestSeller: true, featured: true, newArrival: true,
    colors: [{ name: 'Black', hex: '#111111' }],
    images: ['/products/black-1.png', '/products/black-2.png', '/products/black-3.png', '/products/black-4.png'],
    description: 'A sharp black plain shirt in pure cotton with a clean, minimal finish. Its regular fit and timeless solid black make it an effortless pick for both formal and casual looks.',
  },
  {
    name: 'Plain White Shirt', category: 'Solid Shirts', price: 1299, discountPrice: 799, tint: '#e9eaec',
    material: '100% Cotton', bestSeller: true, featured: true, newArrival: true,
    colors: [{ name: 'White', hex: '#f4f4f2' }],
    images: ['/products/white-1.png', '/products/white-2.png', '/products/white-3.png', '/products/white-4.png'],
    description: 'The essential plain white shirt in crisp pure cotton. A clean collar, regular fit and versatile white make it a true wardrobe staple — perfect for the office, occasions or everyday wear.',
  },
];

export const coupons = [
  { code: 'WELCOME10', description: '10% off your first order', type: 'percent', value: 10, minCart: 999, maxDiscount: 500 },
  { code: 'RICH200', description: 'Flat ₹200 off above ₹1999', type: 'flat', value: 200, minCart: 1999 },
  { code: 'LINEN15', description: '15% off, up to ₹600', type: 'percent', value: 15, minCart: 1499, maxDiscount: 600 },
];

export const banners = [
  { title: 'Elevated Shirts.', subtitle: 'Everyday Style.', ctaText: 'SHOP NOW', link: '/shop', tint: '#c9bfae', position: 'hero', order: 0, image: IMG.blue },
  { title: 'LINEN EDIT', subtitle: 'Light. Breathable. Effortless.', ctaText: 'EXPLORE', link: '/category/linen-shirts', tint: '#c9bfae', position: 'promo', order: 1, image: IMG.linen },
  { title: 'SUMMER SHIRTS', subtitle: 'Designed for warm days.', ctaText: 'SHOP NOW', link: '/shop', tint: '#8f887c', position: 'promo', order: 2, image: IMG.olive },
];
