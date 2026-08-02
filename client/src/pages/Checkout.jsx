// pages/Checkout.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The checkout screen. The router already guards this route behind
// <ProtectedRoute>, so we can safely assume an authenticated user.
//
// Layout (lg and up): two columns —
//   LEFT  → shipping address selection + payment method
//   RIGHT → sticky order summary with the live price breakdown + PLACE ORDER
//
// Pricing (GST-inclusive, per the brief):
//   taxable  = subtotal − discount
//   shipping = taxable >= FREE_SHIP_THRESHOLD ? 0 : SHIP_FEE
//   gst      = taxable − taxable / 1.05     (5% already inside the price)
//   total    = taxable + shipping
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import useSEO from '../hooks/useSEO.js';
import { useCart } from '../context/CartContext.jsx';
import { orderApi, userApi, couponApi } from '../services/endpoints.js';
import { CheckCircle, CheckIcon } from '../components/common/Icons.jsx';
import { price } from '../utils/format.js';
import { PAYMENTS, FREE_SHIP_THRESHOLD, SHIP_FEE } from '../utils/constants.js';

// A blank address form — kept outside the component so its identity is stable.
const EMPTY_ADDRESS = {
  fullName: '', phone: '', line1: '', line2: '',
  city: '', state: '', pincode: '', label: 'Home',
};

export default function Checkout() {
  useSEO({
    title: 'Checkout',
    description: 'Securely complete your RICHBAYY order — choose an address and payment method.',
  });

  const navigate = useNavigate();
  const { items, subtotal, count, clear } = useCart();

  // ── Address state ────────────────────────────────────────────
  const [addresses, setAddresses] = useState([]);
  const [selectedAddr, setSelectedAddr] = useState(null); // address _id
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [showForm, setShowForm] = useState(false);        // inline "add new" form
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [savingAddr, setSavingAddr] = useState(false);

  // ── Payment + submission state ───────────────────────────────
  const [payment, setPayment] = useState('COD');          // 'COD' | 'ONLINE'
  const [placing, setPlacing] = useState(false);

  // ── Coupon (carried over from the cart via sessionStorage) ───
  const [coupon, setCoupon] = useState(null);             // { code, discount, ... }
  const couponCode = coupon?.code || sessionStorage.getItem('richbayy_coupon') || '';

  // Redirect to the cart if there is nothing to check out.
  useEffect(() => {
    if (count === 0) navigate('/cart', { replace: true });
  }, [count, navigate]);

  // Load saved addresses on mount; preselect the default (or the first).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await userApi.addresses();
        if (!alive) return;
        setAddresses(list || []);
        const def = list?.find((a) => a.isDefault) || list?.[0];
        if (def) setSelectedAddr(def._id);
        else setShowForm(true); // no saved addresses → show the form directly
      } catch {
        if (alive) setShowForm(true);
      } finally {
        if (alive) setLoadingAddr(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Re-apply any coupon stashed from the cart so the discount matches the server.
  useEffect(() => {
    const code = sessionStorage.getItem('richbayy_coupon');
    if (!code || !subtotal) return;
    let alive = true;
    (async () => {
      try {
        const data = await couponApi.apply(code, subtotal);
        if (alive) setCoupon(data);
      } catch {
        /* ignore — an invalid/expired coupon simply won't discount */
      }
    })();
    return () => { alive = false; };
  }, [subtotal]);

  // ── Derived pricing ──────────────────────────────────────────
  const discount = coupon?.discount || 0;
  const taxable = Math.max(0, subtotal - discount);
  const shipping = taxable >= FREE_SHIP_THRESHOLD ? 0 : SHIP_FEE;
  const gst = taxable - taxable / 1.05;
  const total = taxable + shipping;

  // ── Address form handlers ────────────────────────────────────
  const onField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const saveAddress = async (e) => {
    e.preventDefault();
    // Minimal client-side validation for the essential fields.
    const required = ['fullName', 'phone', 'line1', 'city', 'state', 'pincode'];
    if (required.some((k) => !form[k].trim())) {
      return toast.error('Please fill in all required fields');
    }
    if (!/^\d{10}$/.test(form.phone.trim())) return toast.error('Enter a valid 10-digit phone');
    if (!/^\d{6}$/.test(form.pincode.trim())) return toast.error('Enter a valid 6-digit pincode');

    setSavingAddr(true);
    try {
      const list = await userApi.addAddress(form);
      setAddresses(list || []);
      // Select the newly added address (assume it's the last one returned).
      const added = list?.[list.length - 1];
      if (added) setSelectedAddr(added._id);
      setForm(EMPTY_ADDRESS);
      setShowForm(false);
      toast.success('Address saved');
    } catch (err) {
      toast.error(err?.message || 'Could not save address');
    } finally {
      setSavingAddr(false);
    }
  };

  // ── Place order ──────────────────────────────────────────────
  const placeOrder = async () => {
    if (!selectedAddr) return toast.error('Please select a delivery address');
    setPlacing(true);
    try {
      const order = await orderApi.create({
        addressId: selectedAddr,
        paymentMethod: payment,     // only COD is selectable until a gateway is wired in
        couponCode,
      });
      await clear();                            // empty the cart
      sessionStorage.removeItem('richbayy_coupon');
      toast.success('Order placed successfully!');
      navigate(`/order-success/${order._id}`);
    } catch (err) {
      toast.error(err?.message || 'Could not place your order');
      setPlacing(false);
    }
  };

  // While redirecting an empty cart, render nothing.
  if (count === 0) return null;

  return (
    <div className="section-x py-8 lg:py-12">
      <h1 className="heading mb-1">Checkout</h1>
      <p className="mb-8 text-[13px] text-muted">Almost there — confirm your details to place the order.</p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px] lg:gap-10">
        {/* ── LEFT: address + payment ─────────────────────────── */}
        <div className="space-y-8">
          {/* Address section */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold tracking-[0.5px]">Shipping Address</h2>
              {addresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowForm((s) => !s)}
                  className="text-[13px] font-medium text-ink underline underline-offset-4 hover:text-gold"
                >
                  {showForm ? 'Cancel' : '+ Add new address'}
                </button>
              )}
            </div>

            {loadingAddr ? (
              <div className="space-y-3">
                <div className="skeleton h-24 rounded-lg" />
                <div className="skeleton h-24 rounded-lg" />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Selectable saved-address cards (radio behaviour) */}
                {addresses.map((a) => {
                  const active = selectedAddr === a._id;
                  return (
                    <label
                      key={a._id}
                      className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-all duration-300 ease-smooth ${
                        active ? 'border-ink bg-sand shadow-card' : 'border-stone hover:border-[#ccc]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        className="sr-only"
                        checked={active}
                        onChange={() => setSelectedAddr(a._id)}
                      />
                      {/* Custom radio dot */}
                      <span
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                          active ? 'border-ink' : 'border-[#bbb]'
                        }`}
                      >
                        {active && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
                      </span>
                      <div className="text-[13px] leading-relaxed">
                        <div className="mb-0.5 flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{a.fullName}</span>
                          {a.label && (
                            <span className="rounded bg-mist px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted">
                              {a.label}
                            </span>
                          )}
                          {a.isDefault && <span className="text-[11px] text-gold">Default</span>}
                        </div>
                        <div className="text-muted">
                          {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} — {a.pincode}
                        </div>
                        <div className="text-muted">Phone: {a.phone}</div>
                      </div>
                    </label>
                  );
                })}

                {/* Inline "add new address" form */}
                <AnimatePresence initial={false}>
                  {showForm && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
                      onSubmit={saveAddress}
                      className="overflow-hidden rounded-lg border border-stone p-4"
                    >
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <input className="field" name="fullName" placeholder="Full name *" value={form.fullName} onChange={onField} />
                        <input className="field" name="phone" placeholder="Phone number *" value={form.phone} onChange={onField} />
                        <input className="field sm:col-span-2" name="line1" placeholder="Address line 1 *" value={form.line1} onChange={onField} />
                        <input className="field sm:col-span-2" name="line2" placeholder="Address line 2 (optional)" value={form.line2} onChange={onField} />
                        <input className="field" name="city" placeholder="City *" value={form.city} onChange={onField} />
                        <input className="field" name="state" placeholder="State *" value={form.state} onChange={onField} />
                        <input className="field" name="pincode" placeholder="Pincode *" value={form.pincode} onChange={onField} />
                        <input className="field" name="label" placeholder="Label (Home / Work)" value={form.label} onChange={onField} />
                      </div>
                      <div className="mt-4 flex gap-3">
                        <button type="submit" disabled={savingAddr} className="btn-primary">
                          {savingAddr ? 'Saving…' : 'Save & Use Address'}
                        </button>
                        {addresses.length > 0 && (
                          <button type="button" onClick={() => setShowForm(false)} className="btn-outline">
                            Cancel
                          </button>
                        )}
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            )}
          </section>

          {/* Payment method section */}
          <section>
            <h2 className="mb-4 text-[16px] font-semibold tracking-[0.5px]">Payment Method</h2>
            <div className="space-y-3">
              {[
                { key: 'COD', title: 'Cash on Delivery', desc: 'Pay in cash when your order arrives.', disabled: false },
                { key: 'ONLINE', title: 'Online Payment', desc: 'Card / UPI / Netbanking — coming soon.', disabled: true },
              ].map((p) => {
                const active = payment === p.key;
                return (
                  <label
                    key={p.key}
                    className={`flex items-start gap-3 rounded-lg border p-4 transition-all duration-300 ease-smooth ${
                      p.disabled
                        ? 'cursor-not-allowed border-stone bg-mist/40 opacity-60'
                        : active
                        ? 'cursor-pointer border-ink bg-sand shadow-card'
                        : 'cursor-pointer border-stone hover:border-[#ccc]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      className="sr-only"
                      checked={active}
                      disabled={p.disabled}
                      onChange={() => !p.disabled && setPayment(p.key)}
                    />
                    <span
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                        active ? 'border-ink' : 'border-[#bbb]'
                      }`}
                    >
                      {active && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
                    </span>
                    <div className="text-[13px]">
                      <div className="flex items-center gap-2 font-semibold">
                        {p.title}
                        {p.disabled && (
                          <span className="rounded bg-mist px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                            Coming soon
                          </span>
                        )}
                      </div>
                      <div className="text-muted">{p.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        {/* ── RIGHT: order summary ────────────────────────────── */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-stone bg-paper p-6 shadow-card">
            <h2 className="mb-5 text-[16px] font-semibold tracking-[0.5px]">Order Summary</h2>

            {/* Cart line items */}
            <ul className="mb-5 max-h-72 space-y-4 overflow-auto pr-1">
              {items.map((it) => (
                <li key={it._id} className="flex gap-3">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded bg-mist">
                    {it.image && <img src={it.image} alt={it.name} className="h-full w-full object-cover" loading="lazy" />}
                    <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-[11px] font-medium text-white">
                      {it.qty}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 text-[13px]">
                    <div className="truncate font-medium">{it.name}</div>
                    <div className="text-muted">
                      {it.size}{it.color ? ` · ${it.color}` : ''}
                    </div>
                  </div>
                  <div className="text-[13px] font-medium">{price(it.lineTotal ?? it.price * it.qty)}</div>
                </li>
              ))}
            </ul>

            {/* Price breakdown */}
            <div className="space-y-2.5 border-t border-stone pt-4 text-[13px]">
              <Row label={`Subtotal (${count} item${count > 1 ? 's' : ''})`} value={price(subtotal)} />
              {discount > 0 && (
                <Row
                  label={
                    <span className="inline-flex items-center gap-1.5 text-success">
                      <CheckIcon size={14} /> Discount{coupon?.code ? ` (${coupon.code})` : ''}
                    </span>
                  }
                  value={<span className="text-success">− {price(discount)}</span>}
                />
              )}
              <Row
                label="Shipping"
                value={shipping === 0 ? <span className="text-success">FREE</span> : price(shipping)}
              />
              <Row label="GST (incl.)" value={price(gst)} muted />
              <div className="flex items-center justify-between border-t border-stone pt-3 text-[16px] font-semibold">
                <span>Total</span>
                <span>{price(total)}</span>
              </div>
            </div>

            {/* Place order */}
            <button
              onClick={placeOrder}
              disabled={placing || !selectedAddr}
              className="btn-primary mt-6 w-full"
            >
              {placing ? 'Placing Order…' : 'PLACE ORDER'}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-muted">
              <CheckCircle size={14} /> 100% secure checkout
            </p>

            {/* Accepted payments */}
            <div className="mt-4 flex items-center justify-center gap-2 border-t border-stone pt-4">
              {PAYMENTS.map((p) => (
                <span key={p} className="rounded border border-stone px-2 py-1 text-[10px] font-medium tracking-wide text-muted">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Small presentational helper for a label/value summary row.
function Row({ label, value, muted = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? 'text-muted' : ''}>{label}</span>
      <span className={muted ? 'text-muted' : 'font-medium'}>{value}</span>
    </div>
  );
}
