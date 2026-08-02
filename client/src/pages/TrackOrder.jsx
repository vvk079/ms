// pages/TrackOrder.jsx
// ─────────────────────────────────────────────────────────────────────────────
// A public order-tracking page (no login required). Visitors type an order
// number (e.g. RB1008) and we look it up via the public track endpoint. On
// success we render:
//   • the order number + current status
//   • a horizontal/vertical stepper for [Placed, Processing, Shipped, Delivered]
//     with reached stages ink-highlighted and future ones muted
//   • the detailed timeline history (status + note + date) from order.timeline
//   • an items summary + total + shipping address
//
// If the page is opened with ?order=RBxxxx it auto-searches on mount.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import useSEO from '../hooks/useSEO.js';
import { orderApi } from '../services/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CheckIcon } from '../components/common/Icons.jsx';
import { price, prettyDate } from '../utils/format.js';

// The canonical happy-path progression. "Cancelled" is handled separately.
const STEPS = ['Placed', 'Processing', 'Shipped', 'Delivered'];

export default function TrackOrder() {
  useSEO({
    title: 'Track Your Order',
    description: 'Enter your RICHBAYY order number to see live delivery status.',
  });

  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [num, setNum] = useState(params.get('order') || '');
  // Accounts are phone-based, so the phone number is the natural proof of
  // ownership here (an email on the account works too, if one was added).
  const [contact, setContact] = useState(user?.phone || user?.email || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Keep it prefilled once the session resolves (e.g. arriving from OrderSuccess).
  useEffect(() => {
    const known = user?.phone || user?.email;
    if (known) setContact((c) => c || known);
  }, [user]);

  // Perform the lookup. Wrapped in useCallback so the auto-search effect is stable.
  // The contact is required server-side so predictable order numbers can't be
  // enumerated to harvest other customers' details.
  const track = useCallback(async (orderNumber, contactArg) => {
    const code = (orderNumber || '').trim();
    const who = (contactArg || '').trim();
    if (!code) return toast.error('Please enter an order number');
    if (!who) return toast.error('Please enter the phone number used to place the order');

    setLoading(true);
    setNotFound(false);
    setOrder(null);
    try {
      const data = await orderApi.track(code, who);
      setOrder(data);
      // Keep the URL shareable/bookmarkable (order number only — never the contact).
      setParams({ order: code }, { replace: true });
    } catch (err) {
      setNotFound(true);
      toast.error(err?.message || 'Order not found. Please check the details.');
    } finally {
      setLoading(false);
    }
  }, [setParams]);

  // Auto-search once when arriving with ?order=RBxxxx and we already know the
  // contact (e.g. a logged-in customer coming from the order-success screen).
  const autoRan = useRef(false);
  useEffect(() => {
    const q = params.get('order');
    if (q && contact && !autoRan.current) {
      autoRan.current = true;
      track(q, contact);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact]);

  const onSubmit = (e) => {
    e.preventDefault();
    track(num, contact);
  };

  // Index of the current step (−1 for Cancelled / unknown).
  const currentStep = order ? STEPS.indexOf(order.status) : -1;
  const cancelled = order?.status === 'Cancelled';

  return (
    <div className="section-x py-10 lg:py-14">
      <div className="mx-auto max-w-2xl">
        {/* ── Search card ─────────────────────────────────────── */}
        <div className="text-center">
          <h1 className="heading mb-2">Track Your Order</h1>
          <p className="mb-7 text-[14px] text-muted">
            Enter your order number to check the latest delivery status.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="mx-auto flex max-w-lg flex-col gap-3 rounded-xl border border-stone bg-paper p-5 shadow-card"
        >
          <input
            className="field"
            placeholder="Order number (e.g. RB1008)"
            value={num}
            onChange={(e) => setNum(e.target.value)}
            autoComplete="off"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className="field flex-1"
              type="text"
              placeholder="Phone number used to place the order"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              autoComplete="tel"
            />
            <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
              {loading ? 'Tracking…' : 'Track'}
            </button>
          </div>
        </form>

        {/* ── Not-found message ───────────────────────────────── */}
        {notFound && !loading && (
          <div className="mx-auto mt-6 max-w-lg rounded-lg border border-stone bg-sand px-5 py-4 text-center text-[13px] text-muted">
            We couldn’t find an order with that number. Double-check it and try again.
          </div>
        )}

        {/* ── Result ──────────────────────────────────────────── */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
            className="mt-8 space-y-6"
          >
            {/* Header: number + current status */}
            <div className="flex flex-col items-start justify-between gap-2 rounded-xl border border-stone bg-paper p-6 shadow-card sm:flex-row sm:items-center">
              <div>
                <div className="text-[11px] uppercase tracking-[2px] text-muted">Order Number</div>
                <div className="text-[20px] font-semibold tracking-[1px]">{order.orderNumber}</div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-[11px] uppercase tracking-[2px] text-muted">Current Status</div>
                <div className={`text-[16px] font-semibold ${cancelled ? 'text-[#c0392b]' : 'text-ink'}`}>
                  {order.status}
                </div>
              </div>
            </div>

            {/* Progress stepper */}
            {cancelled ? (
              <div className="rounded-xl border border-[#f0d6d2] bg-[#fdf1ef] p-6 text-center text-[14px] text-[#c0392b]">
                This order was cancelled.
              </div>
            ) : (
              <div className="rounded-xl border border-stone bg-paper p-6 shadow-card">
                {/* Vertical stepper (each step is a node connected by a line) */}
                <ol className="relative">
                  {STEPS.map((step, i) => {
                    const reached = i <= currentStep;
                    const isLast = i === STEPS.length - 1;
                    return (
                      <li key={step} className="flex gap-4 pb-8 last:pb-0">
                        {/* Node + connector */}
                        <div className="relative flex flex-col items-center">
                          <span
                            className={`grid h-8 w-8 place-items-center rounded-full border-2 ${
                              reached ? 'border-ink bg-ink text-white' : 'border-stone bg-paper text-muted'
                            }`}
                          >
                            {reached ? <CheckIcon size={16} color="#fff" /> : <span className="text-[12px]">{i + 1}</span>}
                          </span>
                          {!isLast && (
                            <span
                              className={`mt-1 w-0.5 flex-1 ${i < currentStep ? 'bg-ink' : 'bg-stone'}`}
                              style={{ minHeight: 32 }}
                            />
                          )}
                        </div>
                        {/* Label */}
                        <div className="pt-1">
                          <div className={`text-[14px] font-semibold ${reached ? 'text-ink' : 'text-muted'}`}>
                            {step}
                          </div>
                          <div className="text-[12px] text-muted">
                            {i === 0 && 'Your order has been received'}
                            {i === 1 && 'We’re preparing your order'}
                            {i === 2 && 'On its way to you'}
                            {i === 3 && 'Delivered to your address'}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {/* Detailed timeline history */}
            {order.timeline?.length > 0 && (
              <div className="rounded-xl border border-stone bg-paper p-6 shadow-card">
                <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-[1px] text-muted">
                  Tracking History
                </h3>
                <ul className="space-y-4">
                  {order.timeline.map((t, i) => (
                    <li key={i} className="flex gap-3 text-[13px]">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ink" />
                      <div>
                        <div className="font-medium">{t.status}</div>
                        {t.note && <div className="text-muted">{t.note}</div>}
                        <div className="text-[12px] text-muted">{prettyDate(t.at)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Items + total */}
            <div className="rounded-xl border border-stone bg-paper p-6 shadow-card">
              <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-[1px] text-muted">
                Items
              </h3>
              <ul className="space-y-4">
                {order.items.map((it, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded bg-mist">
                      {it.image && <img src={it.image} alt={it.name} className="h-full w-full object-cover" loading="lazy" />}
                      <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-[11px] font-medium text-white">
                        {it.qty}
                      </span>
                    </div>
                    <div className="flex-1 text-[13px]">
                      <div className="font-medium">{it.name}</div>
                      <div className="text-muted">
                        {it.size}{it.color ? ` · ${it.color}` : ''}
                      </div>
                    </div>
                    <div className="text-[13px] font-medium">{price(it.price * it.qty)}</div>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-between border-t border-stone pt-4 text-[16px] font-semibold">
                <span>Total</span>
                <span>{price(order.total)}</span>
              </div>
            </div>

            {/* Shipping destination (redacted on the public endpoint for privacy) */}
            {order.shippingAddress?.city && (
              <div className="rounded-xl border border-stone bg-paper p-6 shadow-card">
                <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[1px] text-muted">
                  Shipping To
                </h3>
                <div className="text-[13px] leading-relaxed text-muted">
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
