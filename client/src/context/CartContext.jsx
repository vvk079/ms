// context/CartContext.jsx
// Hybrid cart: guests keep a cart in localStorage; authenticated users use the
// server-side cart (authoritative pricing). On login, the guest cart is merged
// into the account and cleared locally.
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { cartApi } from '../services/endpoints.js';
import { useAuth } from './AuthContext.jsx';
import { effectivePrice } from '../utils/format.js';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const GUEST_KEY = 'richbayy_guest_cart';
const readGuest = () => {
  try { return JSON.parse(localStorage.getItem(GUEST_KEY)) || []; } catch { return []; }
};
const writeGuest = (items) => localStorage.setItem(GUEST_KEY, JSON.stringify(items));

export function CartProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);   // normalised cart lines
  const [loading, setLoading] = useState(false);
  const mergedRef = useRef(false);

  // Derived totals.
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  // ── Guest cart helpers (client-only, enriched at render time by the caller) ──
  const loadGuest = useCallback(() => setItems(readGuest()), []);

  // Load / sync whenever auth state settles.
  useEffect(() => {
    if (authLoading) return;
    (async () => {
      if (isAuthenticated) {
        // Merge any guest cart on first authenticated load, then fetch server cart.
        const guest = readGuest();
        try {
          setLoading(true);
          if (guest.length && !mergedRef.current) {
            mergedRef.current = true;
            const data = await cartApi.merge(guest.map((g) => ({ productId: g.product, size: g.size, color: g.color, qty: g.qty })));
            writeGuest([]);
            setItems(data.items);
          } else {
            const data = await cartApi.get();
            setItems(data.items);
          }
        } catch {
          /* ignore — keep whatever we have */
        } finally {
          setLoading(false);
        }
      } else {
        mergedRef.current = false;
        loadGuest();
      }
    })();
  }, [isAuthenticated, authLoading, loadGuest]);

  // ── Mutations ────────────────────────────────────────────────
  const addItem = useCallback(async (product, { size, color = '', qty = 1 }) => {
    if (!size) return toast.error('Please select a size');

    if (isAuthenticated) {
      const data = await cartApi.add({ productId: product._id, size, color, qty });
      setItems(data.items);
    } else {
      // Guest: store a self-contained line so we can render without a fetch.
      const price = effectivePrice(product);
      const guest = readGuest();
      const key = (i) => i.product === product._id && i.size === size && i.color === color;
      const existing = guest.find(key);
      if (existing) existing.qty += qty;
      else guest.push({
        _id: `${product._id}-${size}-${color}-${Date.now()}`,
        product: product._id, slug: product.slug, name: product.name,
        image: product.images?.[0]?.url || '', tint: product.tint,
        price, size, color, qty,
      });
      writeGuest(guest);
      setItems([...guest]);
    }
    toast.success('Added to bag');
  }, [isAuthenticated]);

  const updateItem = useCallback(async (lineId, qty) => {
    qty = Math.max(1, qty);
    if (isAuthenticated) {
      const data = await cartApi.update(lineId, qty);
      setItems(data.items);
    } else {
      const guest = readGuest().map((i) => (i._id === lineId ? { ...i, qty } : i));
      writeGuest(guest);
      setItems(guest);
    }
  }, [isAuthenticated]);

  const removeItem = useCallback(async (lineId) => {
    if (isAuthenticated) {
      const data = await cartApi.remove(lineId);
      setItems(data.items);
    } else {
      const guest = readGuest().filter((i) => i._id !== lineId);
      writeGuest(guest);
      setItems(guest);
    }
    toast('Removed from bag', { icon: '🗑️' });
  }, [isAuthenticated]);

  const clear = useCallback(async () => {
    if (isAuthenticated) { try { await cartApi.clear(); } catch { /* noop */ } }
    else writeGuest([]);
    setItems([]);
  }, [isAuthenticated]);

  const value = {
    items, subtotal, count, loading,
    addItem, updateItem, removeItem, clear,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
