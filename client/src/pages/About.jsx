// pages/About.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The RICHBAYY brand-story page. It doubles as an information hub because several
// footer links (Returns / Shipping / FAQs / Contact) all point here — so we
// expose anchor sections (#shipping, #returns, #contact) they can deep-link to.
//
// Sections, top to bottom:
//   1. Hero band — "Elevated Shirts. Everyday Style."
//   2. Story — 2-column text + image
//   3. Values grid — Premium Fabrics / Perfect Fit / Sustainable / Made in India
//   4. Stats band — 50k+ customers · 4.8★ · 100% cotton
//   5. Info anchors — Shipping / Returns / Contact
//   6. CTA to /shop
// ─────────────────────────────────────────────────────────────────────────────
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import useSEO from '../hooks/useSEO.js';
import ServiceFeatures from '../components/common/ServiceFeatures.jsx';
import { BRAND } from '../utils/constants.js';

// Reusable fade-up animation preset for scroll-in sections.
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.22, 0.61, 0.36, 1] },
};

// The four brand values (emoji keeps it dependency-free + on-brand warm).
const VALUES = [
  { icon: '🧵', title: 'Premium Fabrics', desc: 'Long-staple cotton and pure linen, sourced for softness that lasts wash after wash.' },
  { icon: '📐', title: 'Perfect Fit', desc: 'Cut on a modern tailored block so every shirt drapes clean, never boxy or tight.' },
  { icon: '🌿', title: 'Sustainable', desc: 'Low-impact dyes, responsible mills and packaging that respects the planet.' },
  { icon: '🇮🇳', title: 'Made in India', desc: 'Crafted by skilled artisans in India, supporting local makers and fair wages.' },
];

// Headline statistics for the trust band.
const STATS = [
  { value: '50k+', label: 'Happy Customers' },
  { value: '4.8★', label: 'Average Rating' },
  { value: '100%', label: 'Pure Cotton & Linen' },
];

export default function About() {
  useSEO({
    title: 'About Us',
    description: `${BRAND} crafts premium shirts with elevated fabrics, a perfect fit and a sustainable, made-in-India ethos.`,
  });

  return (
    <div>
      {/* ── 1. Hero band ────────────────────────────────────── */}
      <section className="section-x bg-sand py-20 text-center lg:py-28">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-3 text-[12px] uppercase tracking-[4px] text-gold"
        >
          Our Story
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
          className="mx-auto max-w-3xl text-[34px] font-semibold leading-tight tracking-[0.5px] sm:text-[46px]"
        >
          Elevated Shirts. Everyday Style.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted"
        >
          {BRAND} was born from a simple belief — that a great shirt should feel as
          good as it looks, and go with everything you already own.
        </motion.p>
      </section>

      {/* ── 2. Story: text + image ──────────────────────────── */}
      <section className="section-x py-16 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div {...fadeUp}>
            <h2 className="heading mb-5">Crafted with intention</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-muted">
              <p>
                We started {BRAND} because shopping for the perfect shirt shouldn’t mean
                compromising between quality, fit and price. Every piece begins with the
                fabric — breathable cottons and airy linens chosen for how they feel
                against the skin.
              </p>
              <p>
                From there, obsessive attention to the details: reinforced seams, mother-of-pearl
                buttons, and a tailored cut refined over dozens of fittings. The result is a
                wardrobe of shirts you’ll reach for again and again.
              </p>
              <p>
                We keep our range tight and our standards high — no fast-fashion churn, just
                considered pieces built to last.
              </p>
            </div>
          </motion.div>

          <motion.div {...fadeUp} className="overflow-hidden rounded-2xl shadow-lift">
            <img
              src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=80"
              alt="RICHBAYY premium shirts craftsmanship"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </motion.div>
        </div>
      </section>

      {/* ── 3. Values grid ──────────────────────────────────── */}
      <section className="section-x bg-mist py-16 lg:py-24">
        <motion.h2 {...fadeUp} className="heading mb-12 text-center">
          What we stand for
        </motion.h2>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 0.61, 0.36, 1] }}
              className="rounded-xl border border-stone bg-paper p-7 text-center shadow-card transition-shadow duration-300 hover:shadow-soft"
            >
              <div className="mb-4 text-[34px]">{v.icon}</div>
              <h3 className="mb-2 text-[15px] font-semibold">{v.title}</h3>
              <p className="text-[13px] leading-relaxed text-muted">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 4. Stats band ───────────────────────────────────── */}
      <section className="section-x bg-ink py-16 text-white lg:py-20">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-10 text-center sm:grid-cols-3">
          {STATS.map((s) => (
            <motion.div key={s.label} {...fadeUp}>
              <div className="text-[40px] font-semibold tracking-[0.5px] text-gold">{s.value}</div>
              <div className="mt-1 text-[13px] uppercase tracking-[2px] text-white/70">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 5. Info anchors: Shipping / Returns / Contact ───── */}
      <section className="section-x py-16 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="heading mb-10 text-center">Help & Information</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Shipping */}
            <div id="shipping" className="scroll-mt-24 rounded-xl border border-stone bg-paper p-7 shadow-card">
              <h3 className="mb-3 text-[15px] font-semibold">Shipping</h3>
              <ul className="space-y-2 text-[13px] leading-relaxed text-muted">
                <li>Free shipping on all orders above ₹1499.</li>
                <li>Flat ₹99 shipping below the free-shipping threshold.</li>
                <li>Dispatched within 24–48 hours; delivered in 2–4 working days.</li>
                <li>Track your parcel any time on our <Link to="/track" className="text-ink underline underline-offset-4">Track Order</Link> page.</li>
              </ul>
            </div>

            {/* Returns */}
            <div id="returns" className="scroll-mt-24 rounded-xl border border-stone bg-paper p-7 shadow-card">
              <h3 className="mb-3 text-[15px] font-semibold">Returns & Exchanges</h3>
              <ul className="space-y-2 text-[13px] leading-relaxed text-muted">
                <li>Easy 7-day return policy from the date of delivery.</li>
                <li>Items must be unworn, unwashed and with tags intact.</li>
                <li>Free size exchanges — we cover the return shipping.</li>
                <li>Refunds processed within 5–7 business days of pickup.</li>
              </ul>
            </div>

            {/* Contact */}
            <div id="contact" className="scroll-mt-24 rounded-xl border border-stone bg-paper p-7 shadow-card">
              <h3 className="mb-3 text-[15px] font-semibold">Contact Us</h3>
              <ul className="space-y-2 text-[13px] leading-relaxed text-muted">
                <li>Email: <a href="mailto:care@richbayy.com" className="text-ink underline underline-offset-4">care@richbayy.com</a></li>
                <li>Phone: +91 98765 43210</li>
                <li>Hours: Mon–Sat, 10am – 7pm IST</li>
                <li>We typically reply within one business day.</li>
              </ul>
            </div>
          </div>

          {/* Reuse the shared service-feature strip for a consistent brand touch. */}
          <div className="mt-12">
            <ServiceFeatures />
          </div>
        </div>
      </section>

      {/* ── 6. CTA ──────────────────────────────────────────── */}
      <section className="section-x bg-sand py-20 text-center">
        <motion.div {...fadeUp}>
          <h2 className="mx-auto max-w-2xl text-[28px] font-semibold tracking-[0.5px] sm:text-[34px]">
            Ready to find your next favourite shirt?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[14px] text-muted">
            Explore the collection and discover shirts made to be worn, loved and lived in.
          </p>
          <Link to="/shop" className="btn-primary mt-8">Shop the Collection</Link>
        </motion.div>
      </section>
    </div>
  );
}
