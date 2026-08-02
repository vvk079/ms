// pages/NotFound.jsx
// ─────────────────────────────────────────────────────────────────────────────
// A minimal, premium 404 page. Rendered by the catch-all route (path="*") in
// App.jsx. Centered, generous whitespace, a big "404", and two clear ways back
// into the store (Home + Shop).
// ─────────────────────────────────────────────────────────────────────────────
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import useSEO from '../hooks/useSEO.js';

export default function NotFound() {
  useSEO({ title: 'Page Not Found' });

  return (
    <div className="section-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
      >
        {/* Oversized 404 */}
        <div className="text-[96px] font-semibold leading-none tracking-[2px] text-ink sm:text-[140px]">
          404
        </div>

        <h1 className="mt-2 text-[22px] font-semibold tracking-[0.5px] sm:text-[26px]">
          Page not found
        </h1>

        <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-muted">
          The page you’re looking for doesn’t exist or may have moved. Let’s get
          you back to something you’ll love.
        </p>

        {/* Ways back into the store */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/" className="btn-primary">Back to Home</Link>
          <Link to="/shop" className="btn-outline">Continue Shopping</Link>
        </div>
      </motion.div>
    </div>
  );
}
