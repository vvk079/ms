// pages/ProductDetails.jsx
// Full product page from the template: image gallery with zoom, colour/size
// selection, delivery-pincode check, quantity, add-to-bag / buy-now, wishlist,
// an info accordion, ratings breakdown + review list/form, related products and
// a "recently viewed" rail (persisted to localStorage).
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import useSEO from '../hooks/useSEO.js';
import { productApi, reviewApi } from '../services/endpoints.js';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { price as fmtPrice, discountPct, effectivePrice, deliveryEstimate } from '../utils/format.js';
import { SIZES, PAYMENTS, MEASUREMENTS, MEASUREMENT_ROWS } from '../utils/constants.js';
import { CheckIcon, CheckCircle, HeartIcon } from '../components/common/Icons.jsx';
import StarRating from '../components/common/StarRating.jsx';
import ServiceFeatures from '../components/common/ServiceFeatures.jsx';
import ProductCard from '../components/product/ProductCard.jsx';
import PageLoader from '../components/common/PageLoader.jsx';

const RECENT_KEY = 'richbayy_recent';

export default function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isWished, toggle } = useWishlist();
  const { isAuthenticated, user } = useAuth();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [imgIdx, setImgIdx] = useState(0);
  const [colorIdx, setColorIdx] = useState(0);
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [openAcc, setOpenAcc] = useState('desc');
  const [pincode, setPincode] = useState('');
  const [pinResult, setPinResult] = useState(null);
  const [zoom, setZoom] = useState(false);
  const [added, setAdded] = useState(false); // flips the CTA to "GO TO CART" after a successful add
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  useSEO({ title: product?.name, description: product?.description, image: product?.images?.[0]?.url });

  // Fetch product + reviews + related whenever the slug changes.
  useEffect(() => {
    setLoading(true);
    window.scrollTo({ top: 0 });
    (async () => {
      try {
        const { product, reviews } = await productApi.get(slug);
        setProduct(product);
        setReviews(reviews);
        setImgIdx(0); setColorIdx(0); setSize(''); setQty(1);
        const rel = await productApi.related(product._id);
        setRelated(rel);

        // Track + read recently viewed (exclude current product).
        const prev = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').filter((p) => p._id !== product._id);
        const mini = { _id: product._id, slug: product.slug, name: product.name, price: product.price, discountPrice: product.discountPrice, images: product.images, tint: product.tint, colors: product.colors };
        localStorage.setItem(RECENT_KEY, JSON.stringify([mini, ...prev].slice(0, 6)));
        setRecent(prev.slice(0, 6));
      } catch {
        toast.error('Product not found');
        navigate('/shop');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, navigate]);

  const selling = product ? effectivePrice(product) : 0;
  const pct = product ? discountPct(product.price, selling) : 0;
  const gallery = product?.images?.length ? product.images : [{ url: '' }];

  // Ratings histogram from the loaded reviews (falls back to product aggregate).
  const ratingBars = useMemo(() => {
    const counts = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));
    const total = reviews.length || 1;
    return counts.map((c) => ({ ...c, width: `${(c.count / total) * 100}%` }));
  }, [reviews]);

  const handleAdd = async (buyNow = false) => {
    if (!size) return toast.error('Please select a size');
    try {
      await addItem(product, { size, color: product.colors?.[colorIdx]?.name || '', qty });
    } catch (err) {
      return toast.error(err?.message || 'Could not add to bag');
    }
    if (buyNow) navigate('/cart');
    else setAdded(true); // CTA now reads "GO TO CART"
  };

  // Reset the CTA back to "ADD TO BAG" whenever the shopper changes their selection.
  useEffect(() => { setAdded(false); }, [size, colorIdx, qty, slug]);

  const checkPincode = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) { setPinResult({ ok: false, msg: 'Enter a valid 6-digit pincode' }); return; }
    // Demo logic: all serviceable, ETA from formatter.
    setPinResult({ ok: true, msg: `Delivery to ${pincode} by ${deliveryEstimate()}` });
  };

  if (loading || !product) return <PageLoader />;

  const accordion = [
    { key: 'desc', title: 'Description', body: product.description },
    { key: 'fabric', title: 'Fabric & Material', body: product.material || 'Premium fabric, breathable and built to last.' },
    { key: 'fit', title: 'Fit', body: product.fit || 'Relaxed tailored fit. Model is 6\'1" and wears size M.' },
    { key: 'care', title: 'Care Instructions', body: product.care || 'Machine wash cold with like colours. Do not bleach. Warm iron if needed.' },
    { key: 'shipping', title: 'Shipping', body: 'Free shipping on prepaid orders above ₹1499. Dispatched within 24 hours.' },
    { key: 'returns', title: 'Returns', body: 'Easy 7-day returns and exchanges. No questions asked.' },
  ];

  return (
    <div>
      {/* Size guide modal */}
      <AnimatePresence>
        {showSizeGuide && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowSizeGuide(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-xl bg-paper p-6 shadow-lift"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[16px] font-semibold">RICHBAYY Size Guide</h3>
                <button onClick={() => setShowSizeGuide(false)} className="text-[20px] leading-none text-[#999] hover:text-ink">×</button>
              </div>
              <p className="mb-4 text-[12.5px] text-muted">Measurement chart in inches. For the best fit, measure a shirt you already own and compare.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-stone text-[12px] uppercase tracking-wide text-muted">
                      <th className="py-2 pr-3 text-left">Size (in)</th>
                      {['S', 'M', 'L', 'XL', 'XXL'].map((s) => (
                        <th key={s} className={`px-2 py-2 text-center ${size === s ? 'text-ink' : ''}`}>{s === 'XXL' ? '2XL' : s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MEASUREMENT_ROWS.map((row) => (
                      <tr key={row} className="border-b border-[#f0f0f0]">
                        <td className="py-2 pr-3 text-[#555]">{row}</td>
                        {['S', 'M', 'L', 'XL', 'XXL'].map((s) => (
                          <td key={s} className={`px-2 py-2 text-center ${size === s ? 'bg-sand font-semibold text-ink' : ''}`}>{MEASUREMENTS[s][row]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumb + main */}
      <div className="px-5 pb-2.5 pt-7 sm:px-10">
        <nav className="mb-5 text-[12.5px] text-[#999]">
          <Link to="/">Home</Link> &nbsp;/&nbsp; <Link to={`/category/${product.category?.slug}`}>{product.category?.name || 'Shirts'}</Link> &nbsp;/&nbsp; <span className="text-[#555]">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          {/* Gallery */}
          <div className="grid grid-cols-[64px_1fr] gap-4 sm:grid-cols-[76px_1fr]">
            <div className="flex flex-col gap-3">
              {gallery.map((g, i) => (
                <button
                  key={i} onClick={() => setImgIdx(i)}
                  className={`h-[76px] w-full overflow-hidden rounded-lg sm:h-[92px] ${i === imgIdx ? 'ring-2 ring-ink' : 'ring-1 ring-[#e5e5e5]'}`}
                  style={{ background: product.tint }}
                >
                  {g.url && <img src={g.url} alt="" className="h-full w-full object-cover" />}
                </button>
              ))}
            </div>
            <div
              className="relative aspect-[3/4] overflow-hidden rounded-xl"
              style={{ background: product.tint }}
              onMouseEnter={() => setZoom(true)} onMouseLeave={() => setZoom(false)}
            >
              {gallery[imgIdx]?.url && (
                <img
                  src={gallery[imgIdx].url} alt={product.name}
                  className={`h-full w-full object-cover transition-transform duration-500 ${zoom ? 'scale-125' : 'scale-100'}`}
                />
              )}
            </div>
          </div>

          {/* Buy box */}
          <div>
            <h1 className="mb-3 text-[26px] font-semibold sm:text-[30px]">{product.name}</h1>
            <div className="mb-4 flex items-center gap-2.5">
              <StarRating value={Math.round(product.rating)} size={15} />
              <span className="text-[13px] text-[#777]">{product.rating || 0} ({product.numReviews || 0} Reviews)</span>
            </div>
            <div className="mb-3.5 flex items-baseline gap-3">
              <span className="text-[26px] font-bold">{fmtPrice(selling)}</span>
              {pct > 0 && <span className="text-[16px] text-[#8a8a8a] line-through decoration-[#e11d48] decoration-2">{fmtPrice(product.price)}</span>}
              {pct > 0 && <span className="text-[14px] font-semibold text-[#c0392b]">Save {pct}%</span>}
            </div>
            {product.bestSeller && <span className="inline-block rounded-[3px] bg-gold px-3 py-1.5 text-[11px] tracking-[1px] text-white">BEST SELLER</span>}
            <p className="my-4 max-w-md text-[14px] leading-relaxed text-[#555]">{product.description}</p>

            {/* Colours */}
            {product.colors?.length > 0 && (
              <>
                <div className="mb-3 text-[14px]">Colour: <span className="text-[#777]">{product.colors[colorIdx]?.name}</span></div>
                <div className="mb-6 flex gap-3.5">
                  {product.colors.map((c, i) => (
                    <button key={i} onClick={() => setColorIdx(i)} title={c.name}
                      className={`h-7 w-7 rounded-full border border-[#ddd] ${i === colorIdx ? 'outline outline-2 outline-offset-2 outline-ink' : ''}`}
                      style={{ background: c.hex }} />
                  ))}
                </div>
              </>
            )}

            {/* Sizes */}
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-[14px]">
                Size: <span className="text-[#777]">{size || 'Select'}</span>
                {size && MEASUREMENTS[size] && (
                  <span className="ml-2 text-[12.5px] text-[#888]">
                    · Chest <span className="font-medium text-ink">{MEASUREMENTS[size].Chest}"</span>
                    <span className="mx-1">·</span>Shoulder <span className="font-medium text-ink">{MEASUREMENTS[size].Shoulder}"</span>
                  </span>
                )}
              </div>
              <button type="button" onClick={() => setShowSizeGuide(true)} className="shrink-0 text-[12.5px] text-[#777] underline hover:text-ink">Size Guide</button>
            </div>
            <div className="mb-7 flex flex-wrap gap-2.5">
              {SIZES.map((sz) => {
                const stock = product.sizes?.find((s) => s.size === sz)?.stock ?? 0;
                const disabled = stock <= 0;
                return (
                  <button
                    key={sz} disabled={disabled} onClick={() => setSize(sz)}
                    className={`min-w-[46px] rounded-md border px-0 py-2.5 text-[13px] transition-colors ${
                      size === sz ? 'border-ink bg-ink text-white' : disabled ? 'cursor-not-allowed border-[#eee] text-[#ccc] line-through' : 'border-[#ddd] hover:border-ink'
                    }`}
                  >{sz}</button>
                );
              })}
            </div>

            {/* Delivery check */}
            <div className="mb-6 rounded-[10px] border border-[#e5e5e5] p-5">
              <div className="mb-3 text-[14px] font-semibold">Check Delivery</div>
              <form onSubmit={checkPincode} className="mb-3.5 flex gap-2.5">
                <input value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter Pincode" className="field flex-1" />
                <button className="rounded-md bg-ink px-6 text-[13px] text-white transition-colors hover:bg-[#2a2a2a]">Check</button>
              </form>
              {pinResult && (
                <div className={`flex items-center gap-2 text-[13px] ${pinResult.ok ? 'text-success' : 'text-[#c0392b]'}`}>
                  {pinResult.ok && <CheckCircle />} {pinResult.msg}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-success">
                {['Delivery in 2–4 days', 'Free Shipping', 'Easy Returns'].map((p) => (
                  <span key={p} className="inline-flex items-center gap-1.5"><CheckIcon size={15} />{p}</span>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-5 flex items-center gap-6">
              <span className="text-[14px]">Quantity</span>
              <div className="inline-flex items-center rounded-md border border-[#ddd]">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-10 w-9 text-[16px] text-[#555]">−</button>
                <span className="w-10 text-center text-[14px]">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="h-10 w-9 text-[16px] text-[#555]">+</button>
              </div>
            </div>

            {/* CTAs */}
            {added ? (
              <button
                onClick={() => navigate('/cart')}
                className="mb-3 mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-success py-4 text-[14px] tracking-[1.5px] text-white transition-all hover:brightness-95"
              >
                <CheckIcon size={16} color="#fff" /> GO TO CART
              </button>
            ) : (
              <button
                onClick={() => handleAdd(false)}
                className="mb-3 mt-4 w-full rounded-md bg-ink py-4 text-[14px] tracking-[1.5px] text-white transition-all hover:bg-[#2a2a2a]"
              >
                ADD TO BAG
              </button>
            )}
            <button onClick={() => handleAdd(true)} className="mb-4 w-full rounded-md border border-ink py-3.5 text-[14px] tracking-[1.5px] transition-colors hover:bg-ink hover:text-white">BUY NOW</button>
            <button onClick={() => toggle(product._id)} className="inline-flex items-center gap-2 text-[14px] text-[#555]">
              <HeartIcon size={18} fill={isWished(product._id) ? '#111' : 'none'} color="#555" />
              {isWished(product._id) ? 'Saved to Wishlist' : 'Save to Wishlist'}
            </button>

            {/* Payments */}
            <div className="mt-6 flex items-center gap-5 border-t border-stone pt-5">
              {PAYMENTS.map((p) => <span key={p} className="text-[14px] font-bold italic text-[#666]">{p}</span>)}
              <span className="text-[12px] text-[#777]">COD Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Service strip */}
      <div className="mt-8 px-5 sm:px-10"><ServiceFeatures /></div>

      {/* Accordion + reviews */}
      <div className="grid gap-10 px-5 py-11 sm:px-10 lg:grid-cols-[1fr_1.35fr]">
        {/* Accordion */}
        <div>
          {accordion.map((a) => (
            <div key={a.key} className="border-b border-[#eee]">
              <button onClick={() => setOpenAcc((o) => (o === a.key ? null : a.key))} className="flex w-full items-center justify-between py-4 text-left text-[14px] font-semibold">
                <span>{a.title}</span><span className="text-[18px] text-[#999]">{openAcc === a.key ? '−' : '+'}</span>
              </button>
              <AnimatePresence>
                {openAcc === a.key && (
                  <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden text-[13.5px] leading-relaxed text-[#666]">
                    <span className="block pb-4">{a.body}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Reviews */}
        <div>
          <h3 className="mb-5 text-[20px] font-semibold">Ratings &amp; Reviews</h3>
          <div className="mb-6 flex items-center gap-8">
            <div className="text-center">
              <div className="text-[46px] font-bold leading-none">{product.rating || 0}</div>
              <div className="my-2"><StarRating value={Math.round(product.rating)} size={15} /></div>
              <div className="text-[12px] text-[#888]">Based on {product.numReviews || 0} reviews</div>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              {ratingBars.map((r) => (
                <div key={r.star} className="flex items-center gap-2.5 text-[12px] text-[#888]">
                  <span className="w-2.5">{r.star}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded bg-[#eee]"><div className="h-full bg-ink" style={{ width: r.width }} /></div>
                  <span className="w-6 text-right">{r.count}</span>
                </div>
              ))}
            </div>
          </div>

          <ReviewForm productId={product._id} isAuthenticated={isAuthenticated} onAdded={(rv) => { setReviews((rs) => [rv, ...rs]); }} />

          {reviews.length === 0 && <p className="mt-4 text-[14px] text-muted">No reviews yet — be the first to review this product.</p>}
          {reviews.map((rv) => (
            <div key={rv._id} className="flex gap-3.5 border-t border-[#f0f0f0] py-4">
              <div className="h-10 w-10 shrink-0 rounded-full bg-[#c9bfae]" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[14px] font-semibold">{rv.name}</span>
                    {rv.verified && <span className="ml-2 text-[11px] text-success">✓ Verified Buyer</span>}
                  </div>
                  <span className="text-[12px] text-[#aaa]">{new Date(rv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="my-1.5"><StarRating value={rv.rating} size={12} /></div>
                <p className="text-[13.5px] leading-snug text-[#555]">{rv.comment}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="px-5 pb-6 pt-2.5 sm:px-10">
          <h2 className="mb-5 text-[15px] font-semibold tracking-[1.5px]">YOU MAY ALSO LIKE</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {related.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      {/* Recently viewed */}
      {recent.length > 0 && (
        <section className="px-5 pb-14 pt-6 sm:px-10">
          <h2 className="mb-5 text-[15px] font-semibold tracking-[1.5px]">RECENTLY VIEWED</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {recent.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Review form (inline) ─────────────────────────────────────
function ReviewForm({ productId, isAuthenticated, onAdded }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.error('Please log in to write a review');
    if (!comment.trim()) return toast.error('Please write a comment');
    setBusy(true);
    try {
      const rv = await reviewApi.create(productId, { rating, comment });
      onAdded(rv);
      setComment(''); setOpen(false);
      toast.success('Thanks for your review!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-4 rounded-lg border border-[#eee] p-4">
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-[13.5px] font-semibold underline">Write a review</button>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <StarRating value={rating} editable size={22} onChange={setRating} />
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Share your experience…" className="field resize-none" />
          <div className="flex gap-3">
            <button disabled={busy} className="btn-primary px-6 py-2.5">{busy ? 'Posting…' : 'Submit Review'}</button>
            <button type="button" onClick={() => setOpen(false)} className="text-[13px] text-muted">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
