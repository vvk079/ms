// pages/Wishlist.jsx
// The saved-items grid. Logged-in users get their hydrated product list straight
// from WishlistContext. Guests only have a Set of product ids in localStorage, so
// we lazily fetch each product to render a full card.
//
// Removal is handled by <ProductCard>'s built-in heart toggle, so we only need to
// render cards and keep the list in sync when ids change.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import useSEO from '../hooks/useSEO.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { productApi } from '../services/endpoints.js';
import ProductCard from '../components/product/ProductCard.jsx';
import { ProductGridSkeleton } from '../components/common/Skeleton.jsx';

export default function Wishlist() {
  useSEO({ title: 'My Wishlist', description: 'Your saved RICHBAYY products — keep track of the shirts you love.' });

  const { isAuthenticated } = useAuth();
  const { ids, products } = useWishlist();

  // For guests we hydrate products from their saved ids.
  const [guestProducts, setGuestProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // A stable key for the id set so the effect refires when it actually changes.
  const idKey = [...ids].sort().join(',');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      if (isAuthenticated) {
        // Context already holds the hydrated list — nothing to fetch.
        if (alive) setLoading(false);
        return;
      }
      // Guest: fetch each saved product by id (tolerate individual failures).
      try {
        const list = await Promise.all(
          [...ids].map((id) => productApi.get(id).then((r) => r.product).catch(() => null)),
        );
        if (alive) setGuestProducts(list.filter(Boolean));
      } catch {
        if (alive) setGuestProducts([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, idKey]);

  // The list to render depends on auth mode.
  const list = isAuthenticated ? products : guestProducts;
  const count = isAuthenticated ? products.length : ids.size;

  return (
    <div className="px-5 py-8 sm:px-8 lg:px-10">
      {/* Heading */}
      <div className="mb-7">
        <h1 className="heading text-[20px]">
          My Wishlist <span className="text-muted">({count})</span>
        </h1>
      </div>

      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : list.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone bg-sand py-20 text-center">
          <div className="mb-3 text-5xl">🤍</div>
          <h3 className="mb-1 text-[18px] font-semibold">Your wishlist is empty</h3>
          <p className="mb-6 max-w-sm text-[13.5px] text-muted">
            Tap the heart on any product to save it here for later.
          </p>
          <Link to="/shop" className="btn-primary">Explore the Collection</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence>
            {list.map((p) => (
              <motion.div
                key={p._id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
              >
                {/* ProductCard already renders the heart toggle for removal. */}
                <ProductCard product={p} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
