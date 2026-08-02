// context/WishlistContext.jsx
// Hybrid wishlist. Guests store product ids in localStorage; authenticated users
// use the server wishlist. We keep a fast Set of ids for O(1) "isWished" checks
// plus the hydrated product list for the wishlist page.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { wishlistApi } from '../services/endpoints.js';
import { useAuth } from './AuthContext.jsx';

const WishlistContext = createContext(null);
export const useWishlist = () => useContext(WishlistContext);

const GUEST_KEY = 'richbayy_guest_wishlist';
const readGuest = () => {
  try { return JSON.parse(localStorage.getItem(GUEST_KEY)) || []; } catch { return []; }
};
const writeGuest = (ids) => localStorage.setItem(GUEST_KEY, JSON.stringify(ids));

export function WishlistProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [ids, setIds] = useState(() => new Set());  // set of product ids
  const [products, setProducts] = useState([]);      // hydrated (server) list

  const refresh = useCallback(async () => {
    if (isAuthenticated) {
      const list = await wishlistApi.get();
      setProducts(list);
      setIds(new Set(list.map((p) => p._id)));
    } else {
      setIds(new Set(readGuest()));
      setProducts([]); // guest page hydrates lazily from ids if needed
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    refresh().catch(() => {});
  }, [authLoading, refresh]);

  const toggle = useCallback(async (productId) => {
    if (isAuthenticated) {
      const { added } = await wishlistApi.toggle(productId);
      await refresh();
      toast(added ? 'Saved to wishlist' : 'Removed from wishlist', { icon: added ? '❤️' : '🤍' });
    } else {
      const set = new Set(readGuest());
      const added = !set.has(productId);
      added ? set.add(productId) : set.delete(productId);
      writeGuest([...set]);
      setIds(new Set(set));
      toast(added ? 'Saved to wishlist' : 'Removed from wishlist', { icon: added ? '❤️' : '🤍' });
    }
  }, [isAuthenticated, refresh]);

  const isWished = useCallback((id) => ids.has(id), [ids]);

  const value = { ids, products, count: ids.size, isWished, toggle, refresh };
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
