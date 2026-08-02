// pages/Home.jsx
// The storefront landing page — a faithful build of the RICHBAYY template:
// 3-panel hero with overlaid CTA, feature strip, "Shop by Category" grid, and a
// "Best Sellers" product grid, plus a brand-story band, reviews and newsletter.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';

import useScrollReveal from '../hooks/useScrollReveal.js';
import useSEO from '../hooks/useSEO.js';
import { productApi } from '../services/endpoints.js';
import ProductCard from '../components/product/ProductCard.jsx';
import ServiceFeatures from '../components/common/ServiceFeatures.jsx';
import { ProductGridSkeleton } from '../components/common/Skeleton.jsx';
import { StarIcon } from '../components/common/Icons.jsx';

// Editorial imagery reused by the brand-story panel.
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&q=80',
  'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=1000&q=80',
  'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=1000&q=80',
];

const REVIEWS = [
  { name: 'Arjun Mehta', text: 'The fabric feels premium and super comfortable. Best shirts I own.', city: 'Mumbai' },
  { name: 'Rohit Sharma', text: 'Perfect fit and looks exactly like the pictures. Highly recommended.', city: 'Delhi' },
  { name: 'Karan Malhotra', text: 'Loved the colour and quality. Will definitely buy more from RICHBAYY.', city: 'Bengaluru' },
  { name: 'Aditya Rao', text: 'Fast delivery and premium packaging. The linen edit is unreal.', city: 'Pune' },
];

export default function Home() {
  useSEO({ title: 'Premium Shirts for the Modern Man', description: 'Elevated shirts. Everyday style. Premium fabrics, timeless fits — RICHBAYY.' });
  const reveal = useScrollReveal([]);

  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const best = await productApi.list({ bestSeller: 'true', limit: 6 });
        setBestSellers(best.products);
      } catch (e) {
        /* Non-fatal: home still renders its static sections. */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div ref={reveal}>
      {/* ── HERO ─────────────────────────────────────── */}
      {/* Brand header banner (logo + tagline are baked into the artwork). Shown
          full-width at its natural ratio so nothing is cropped, with a Shop CTA. */}
      <section className="relative w-full overflow-hidden bg-[#eceae4]">
        <Link to="/shop" aria-label="Shop the RICHBAYY collection" className="block">
          <img
            src="/hero-header.png?v=3"
            alt="RICHBAYY Clothing — Timeless essentials. Made for the modern man."
            className="h-[240px] w-full object-cover object-center sm:h-[340px] lg:h-[440px]"
            fetchpriority="high"
          />
        </Link>

        {/* Shop CTA over the banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1], delay: 0.15 }}
          className="absolute inset-x-0 bottom-4 flex justify-center sm:bottom-10"
        >
          <Link to="/shop" className="btn-primary shadow-btn">SHOP THE COLLECTION</Link>
        </motion.div>
      </section>

      {/* ── BEST SELLERS ─────────────────────────────── */}
      <section className="bg-paper px-5 pb-14 pt-12 sm:px-10">
        <div data-reveal className="mb-6 flex items-baseline justify-between">
          <h2 className="heading">BEST SELLERS</h2>
          <Link to="/shop?filter=bestSeller" className="text-[13px] tracking-[0.8px]">VIEW <span className="underline">ALL</span></Link>
        </div>
        {loading ? <ProductGridSkeleton /> : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {bestSellers.map((p) => <div data-reveal key={p._id}><ProductCard product={p} badge="BEST SELLER" /></div>)}
          </div>
        )}
      </section>

      {/* ── BRAND STORY ──────────────────────────────── */}
      <section className="grid items-stretch lg:grid-cols-2">
        <div className="flex flex-col justify-center bg-[#efeeea] px-6 py-16 sm:px-14">
          <div className="mb-3 text-[12px] tracking-[2px] text-[#777]">OUR STORY</div>
          <h2 className="mb-4 text-[30px] font-semibold leading-[1.1] sm:text-[36px]">Crafted for the<br />modern wardrobe.</h2>
          <p className="mb-6 max-w-md text-[14.5px] leading-relaxed text-[#555]">
            RICHBAYY began with a simple belief — that a great shirt is the foundation of great style.
            We obsess over fabric, fit and finish so you can dress effortlessly, every single day.
          </p>
          <Link to="/about" className="btn-outline w-fit">READ OUR STORY</Link>
        </div>
        <div className="min-h-[320px] bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGES[1]})` }} />
      </section>

      {/* ── REVIEWS ──────────────────────────────────── */}
      <section className="px-5 py-16 sm:px-10">
        <h2 data-reveal className="mb-10 text-center text-[24px] font-medium tracking-[1px]">WHAT OUR CUSTOMERS SAY</h2>
        <Swiper
          modules={[Autoplay]} spaceBetween={20} autoplay={{ delay: 3200, disableOnInteraction: false }}
          breakpoints={{ 0: { slidesPerView: 1.1 }, 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
        >
          {REVIEWS.map((r, i) => (
            <SwiperSlide key={i}>
              <div className="h-full rounded-xl border border-stone bg-paper p-7">
                <div className="mb-3 flex gap-0.5">{Array.from({ length: 5 }).map((_, s) => <StarIcon key={s} size={15} />)}</div>
                <p className="mb-5 text-[14.5px] leading-relaxed text-[#444]">“{r.text}”</p>
                <div className="text-[14px] font-semibold">{r.name}</div>
                <div className="text-[12.5px] text-muted">{r.city}</div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* ── SERVICE STRIP ────────────────────────────── */}
      <section className="px-5 pb-16 sm:px-10">
        <ServiceFeatures />
      </section>
    </div>
  );
}
