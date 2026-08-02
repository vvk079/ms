// components/product/ProductCard.jsx
// The catalogue card used on Home, Shop, related products, wishlist. Mirrors the
// template: tinted image tile with rounded corners, floating wishlist heart,
// name, price (with strikethrough when discounted), and colour swatches. Hovers
// lift and reveal a "Quick View" affordance.
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartIcon } from '../common/Icons.jsx';
import { price as fmtPrice, effectivePrice, discountPct } from '../../utils/format.js';
import { useWishlist } from '../../context/WishlistContext.jsx';

export default function ProductCard({ product, badge, onQuickView }) {
  const navigate = useNavigate();
  const { isWished, toggle } = useWishlist();

  const selling = effectivePrice(product);
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const pct = discountPct(product.price, selling);
  const img = product.images?.[0]?.url;
  const wished = isWished(product._id);

  const go = () => navigate(`/product/${product.slug}`);

  return (
    <motion.div
      layout
      whileHover={{ y: -6 }}
      transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      className="group cursor-pointer"
      onClick={go}
    >
      {/* Image tile */}
      <div
        className="relative flex h-[300px] items-end justify-center overflow-hidden rounded-[10px] shadow-card sm:h-[320px]"
        style={{ background: product.tint || '#ddd6cb' }}
      >
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-smooth group-hover:scale-105"
          />
        ) : (
          <span className="pb-3.5 font-mono text-[10px] uppercase text-black/30">
            {product.name}
          </span>
        )}

        {/* Badge (NEW / BEST SELLER / -30%) */}
        {(badge || pct > 0) && (
          <span className="absolute left-3 top-3 z-10 rounded-[3px] bg-ink px-2 py-1 text-[10px] tracking-[1px] text-white">
            {badge || `-${pct}%`}
          </span>
        )}

        {/* Wishlist heart */}
        <button
          aria-label="Toggle wishlist"
          onClick={(e) => { e.stopPropagation(); toggle(product._id); }}
          className="absolute right-3 top-3 z-10 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white shadow-soft transition-transform hover:scale-110"
        >
          <HeartIcon size={15} fill={wished ? '#111' : 'none'} />
        </button>

        {/* Quick view (desktop hover) */}
        {onQuickView && (
          <button
            onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
            className="absolute bottom-0 left-0 right-0 z-10 translate-y-full bg-ink/90 py-3 text-[12px] tracking-[1.5px] text-white opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
          >
            QUICK VIEW
          </button>
        )}
      </div>

      {/* Meta */}
      <div className="px-0.5 pt-3">
        <Link
          to={`/product/${product.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="line-clamp-1 text-[14px] hover:text-muted"
        >
          {product.name}
        </Link>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[14px] font-semibold">{fmtPrice(selling)}</span>
          {hasDiscount && (
            <span className="text-[12.5px] text-[#8a8a8a] line-through decoration-[#e11d48] decoration-2">{fmtPrice(product.price)}</span>
          )}
        </div>

        {/* Colour swatches */}
        {product.colors?.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5">
            {product.colors.slice(0, 4).map((c, i) => (
              <span
                key={i}
                title={c.name}
                className="h-[15px] w-[15px] rounded-full border border-[#ddd]"
                style={{ background: c.hex }}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="ml-0.5 text-[12px] text-[#888]">+{product.colors.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
