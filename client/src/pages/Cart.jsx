// pages/Cart.jsx
// The "Shopping Bag" page — a faithful build of the RICHBAYY template.
//
// Two-column layout on large screens: the line items (left, wider) and a sticky
// Order Summary card (right). Below the fold sit the service-feature strip and a
// "We Accept" payments row. Guests and logged-in users share the same UI because
// CartContext abstracts the storage away.
//
// Pricing rules (GST-inclusive, as per the brief):
//   taxable  = subtotal − discount
//   shipping = taxable >= FREE_SHIP_THRESHOLD ? 0 : SHIP_FEE
//   gst      = taxable − taxable / 1.05      (5% tax already inside the price)
//   total    = taxable + shipping
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import useSEO from '../hooks/useSEO.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { couponApi } from '../services/endpoints.js';
import ServiceFeatures from '../components/common/ServiceFeatures.jsx';
import { CheckCircle } from '../components/common/Icons.jsx';
import { price, deliveryEstimate } from '../utils/format.js';
import { FREE_SHIP_THRESHOLD, SHIP_FEE, PAYMENTS } from '../utils/constants.js';

export default function Cart() {
  useSEO({ title: 'Shopping Bag', description: 'Review the items in your RICHBAYY shopping bag and checkout securely.' });

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, subtotal, count, updateItem, removeItem } = useCart();
  const { toggle: toggleWishlist, isWished } = useWishlist();

  // ── Coupon state (persisted only in this component + sessionStorage on checkout) ──
  const [coupon, setCoupon] = useState(null);      // { code, description, discount, newTotal }
  const [couponInput, setCouponInput] = useState('');
  const [applying, setApplying] = useState(false);

  // ── Pincode delivery check ────────────────────────────────────
  const [pincode, setPincode] = useState('');
  const [pinChecked, setPinChecked] = useState(false);

  // ── Derived pricing ───────────────────────────────────────────
  const discount = coupon?.discount || 0;
  const taxable = Math.max(0, subtotal - discount);
  const shipping = taxable >= FREE_SHIP_THRESHOLD ? 0 : SHIP_FEE;
  const gst = taxable - taxable / 1.05;             // 5% already inside the price
  const total = taxable + shipping;
  const freeShipGap = FREE_SHIP_THRESHOLD - taxable; // how much more for free shipping

  // ── Coupon handlers ───────────────────────────────────────────
  const applyCoupon = async (e) => {
    e.preventDefault();
    const code = couponInput.trim();
    if (!code) return;
    setApplying(true);
    try {
      const data = await couponApi.apply(code, subtotal);
      setCoupon(data);
      toast.success(`Coupon “${data.code}” applied`);
    } catch (err) {
      setCoupon(null);
      toast.error(err?.message || 'Invalid coupon code');
    } finally {
      setApplying(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput('');
    toast('Coupon removed', { icon: '🏷️' });
  };

  // Move a line to the wishlist, then drop it from the bag. `toggle` flips state,
  // so only call it when the item isn't already saved — otherwise we'd un-save it.
  const moveToWishlist = async (line) => {
    try {
      if (!isWished(line.product)) await toggleWishlist(line.product);
      await removeItem(line._id);
    } catch {
      toast.error('Could not move item');
    }
  };

  // ── Pincode check ─────────────────────────────────────────────
  const checkPincode = (e) => {
    e.preventDefault();
    if (/^\d{6}$/.test(pincode)) setPinChecked(true);
    else {
      setPinChecked(false);
      toast.error('Enter a valid 6-digit pincode');
    }
  };

  // ── Checkout ──────────────────────────────────────────────────
  const proceed = () => {
    // Stash the coupon so Checkout can re-apply it server-side.
    if (coupon?.code) sessionStorage.setItem('richbayy_coupon', coupon.code);
    else sessionStorage.removeItem('richbayy_coupon');

    if (!isAuthenticated) navigate('/login', { state: { from: '/checkout' } });
    else navigate('/checkout');
  };

  // ── Empty state ───────────────────────────────────────────────
  if (count === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-5 py-24 text-center sm:px-8 lg:px-10">
        <div className="mb-4 text-6xl">🛍️</div>
        <h1 className="mb-2 text-[24px] font-medium">Your bag is empty</h1>
        <p className="mb-7 max-w-sm text-[14px] text-muted">
          Looks like you haven’t added anything yet. Explore the collection and find your next favourite shirt.
        </p>
        <Link to="/shop" className="btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 sm:px-8 lg:px-10">
      {/* Header row */}
      <div className="mb-7 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-[24px] font-medium sm:text-[28px]">
          Shopping Bag <span className="text-muted">({count})</span>
        </h1>
        <Link to="/shop" className="text-[13.5px] tracking-[0.3px] text-ink hover:text-muted">
          Continue Shopping →
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.9fr_1fr]">
        {/* ── Line items ─────────────────────────────── */}
        <div>
          <div className="divide-y divide-stone rounded-xl border border-stone">
            <AnimatePresence initial={false}>
              {items.map((line) => (
                <motion.div
                  key={line._id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.25 } }}
                  className="flex gap-4 overflow-hidden p-4 sm:p-5"
                >
                  {/* Thumb (70×84) */}
                  <Link
                    to={line.slug ? `/product/${line.slug}` : '/shop'}
                    className="relative flex h-[84px] w-[70px] shrink-0 items-center justify-center overflow-hidden rounded-[8px]"
                    style={{ background: line.tint || '#e7e3da' }}
                  >
                    {line.image ? (
                      <img src={line.image} alt={line.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="px-1 text-center text-[9px] uppercase text-black/30">{line.name}</span>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          to={line.slug ? `/product/${line.slug}` : '/shop'}
                          className="line-clamp-1 text-[14.5px] font-medium hover:text-muted"
                        >
                          {line.name}
                        </Link>
                        <div className="mt-0.5 text-[12.5px] text-muted">
                          {line.size}{line.color ? ` / ${line.color}` : ''}
                        </div>
                        <div className="mt-1 text-[13px] text-ink">{price(line.price)}</div>
                        {line.inStock === false && (
                          <div className="mt-1 text-[12px] text-red-500">Out of stock</div>
                        )}
                      </div>
                      {/* Line total */}
                      <div className="shrink-0 text-[14.5px] font-semibold">
                        {price(line.lineTotal ?? line.price * line.qty)}
                      </div>
                    </div>

                    {/* Bottom row: qty stepper + actions */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      {/* Quantity stepper */}
                      <div className="flex items-center rounded-[8px] border border-stone">
                        <button
                          aria-label="Decrease quantity"
                          onClick={() => updateItem(line._id, line.qty - 1)}
                          disabled={line.qty <= 1}
                          className="flex h-[32px] w-[32px] items-center justify-center text-[16px] disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className="w-[34px] text-center text-[13.5px]">{line.qty}</span>
                        <button
                          aria-label="Increase quantity"
                          onClick={() => updateItem(line._id, line.qty + 1)}
                          className="flex h-[32px] w-[32px] items-center justify-center text-[16px]"
                        >
                          +
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-4 text-[12.5px]">
                        <button
                          onClick={() => moveToWishlist(line)}
                          className="text-muted underline underline-offset-2 hover:text-ink"
                        >
                          Move to wishlist
                        </button>
                        <button
                          onClick={() => removeItem(line._id)}
                          className="text-muted underline underline-offset-2 hover:text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Free-shipping nudge */}
          {shipping > 0 && freeShipGap > 0 && (
            <div className="mt-4 rounded-lg bg-mist px-4 py-3 text-[13px] text-ink">
              Add <span className="font-semibold">{price(freeShipGap)}</span> more to unlock{' '}
              <span className="font-semibold text-success">free shipping</span>.
            </div>
          )}
        </div>

        {/* ── Order summary ──────────────────────────── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-stone p-5 sm:p-6">
            <h2 className="mb-4 text-[15px] font-semibold uppercase tracking-[1px]">Order Summary</h2>

            {/* Coupon */}
            {!coupon ? (
              <form onSubmit={applyCoupon} className="mb-4 flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  className="field flex-1 !py-2.5 text-[13px] uppercase"
                  aria-label="Coupon code"
                />
                <button type="submit" disabled={applying} className="btn-outline !px-4 !py-2.5 text-[13px]">
                  {applying ? '…' : 'Apply'}
                </button>
              </form>
            ) : (
              <div className="mb-4 flex items-center justify-between rounded-lg bg-sand px-3.5 py-2.5">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-success">{coupon.code} applied</div>
                  {coupon.description && (
                    <div className="line-clamp-1 text-[11.5px] text-muted">{coupon.description}</div>
                  )}
                </div>
                <button
                  onClick={removeCoupon}
                  aria-label="Remove coupon"
                  className="ml-3 text-[18px] leading-none text-muted hover:text-ink"
                >
                  ×
                </button>
              </div>
            )}

            {/* Totals */}
            <dl className="space-y-2.5 border-t border-stone pt-4 text-[13.5px]">
              <Row label="Subtotal" value={price(subtotal)} />
              {discount > 0 && (
                <Row label="Discount" value={`− ${price(discount)}`} valueClass="text-success font-medium" />
              )}
              <div className="flex items-center justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className="font-medium">
                  {shipping === 0 ? <span className="text-success">Free</span> : price(shipping)}
                </dd>
              </div>
              <p className="text-[11.5px] text-muted">
                Free shipping on orders above {price(FREE_SHIP_THRESHOLD)}.
              </p>

              <div className="mt-2 flex items-baseline justify-between border-t border-stone pt-3">
                <dt className="text-[15px] font-semibold">Total</dt>
                <dd className="text-[17px] font-semibold">{price(total)}</dd>
              </div>
              <p className="text-[11.5px] text-muted">
                (Inclusive of all taxes • incl. GST {price(gst)})
              </p>
            </dl>

            {/* Pincode / delivery check */}
            <form onSubmit={checkPincode} className="mt-5 border-t border-stone pt-4">
              <label className="mb-1.5 block text-[12.5px] font-medium">Check delivery</label>
              <div className="flex gap-2">
                <input
                  value={pincode}
                  onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '').slice(0, 6)); setPinChecked(false); }}
                  placeholder="6-digit pincode"
                  inputMode="numeric"
                  className="field flex-1 !py-2.5 text-[13px]"
                  aria-label="Pincode"
                />
                <button type="submit" className="btn-outline !px-4 !py-2.5 text-[13px]">Check</button>
              </div>
              {pinChecked && (
                <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-success">
                  <CheckCircle size={15} />
                  Deliverable — estimated by {deliveryEstimate()}
                </div>
              )}
            </form>

            {/* CTA */}
            <button onClick={proceed} className="btn-primary mt-5 w-full">
              PROCEED TO CHECKOUT
            </button>
          </div>

          {/* We Accept */}
          <div className="mt-4 rounded-xl border border-stone px-5 py-4">
            <div className="mb-2 text-[11.5px] uppercase tracking-[1px] text-muted">We Accept</div>
            <div className="flex flex-wrap gap-2">
              {PAYMENTS.map((p) => (
                <span
                  key={p}
                  className="rounded-[5px] border border-stone bg-paper px-2.5 py-1 text-[11px] font-semibold tracking-[0.5px] text-ink"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Service features strip */}
      <div className="mt-12">
        <ServiceFeatures />
      </div>
    </div>
  );
}

// A single subtotal/total row.
function Row({ label, value, valueClass = 'font-medium' }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={valueClass}>{value}</dd>
    </div>
  );
}
