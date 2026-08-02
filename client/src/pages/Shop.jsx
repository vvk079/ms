// pages/Shop.jsx
// The catalogue / product-listing page. Serves both `/shop` and `/category/:slug`.
//
// Layout mirrors the RICHBAYY template:
//   • Left sidebar of filters (Category, Gender, Colour, Size, Price). On mobile
//     the sidebar collapses behind a "Filters" button that opens a slide-in drawer.
//   • A top bar with the result count, a Sort dropdown and a Grid / List toggle.
//   • A responsive product grid (2 cols mobile → 3 → 4 on lg) using <ProductCard>.
//   • Numbered pagination (prev / 1 2 3 / next) driven by the API's page count.
//
// All active filters live in the URL search params so the page is shareable and
// the browser back button "just works". The route `:slug` param (category pages)
// is folded into the same query the API receives.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import useSEO from '../hooks/useSEO.js';
import { productApi, categoryApi } from '../services/endpoints.js';
import ProductCard from '../components/product/ProductCard.jsx';
import { ProductGridSkeleton } from '../components/common/Skeleton.jsx';
import { CaretDown, CheckIcon } from '../components/common/Icons.jsx';
import { price as fmtPrice } from '../utils/format.js';

// Sort options shown in the dropdown → API `sort` value.
const SORTS = [
  ['newest', 'Newest'],
  ['popular', 'Most Popular'],
  ['rating', 'Top Rated'],
  ['price-asc', 'Price: Low to High'],
  ['price-desc', 'Price: High to Low'],
];

const GENDERS = ['Men', 'Women', 'Unisex'];
const PAGE_LIMIT = 12;

export default function Shop() {
  // `/category/:slug` provides the category via the route; `/shop` leaves it undefined.
  const { slug: routeSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Reference data (loaded once) ──────────────────────────────
  const [categories, setCategories] = useState([]);
  const [facets, setFacets] = useState({ colors: [], sizes: [], priceRange: { min: 0, max: 10000 } });

  // ── Results ───────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // ── View state (not persisted to the URL) ─────────────────────
  const [view, setView] = useState('grid');      // 'grid' | 'list'
  const [drawerOpen, setDrawerOpen] = useState(false); // mobile filter drawer

  // Read the current filter values straight from the URL (single source of truth).
  const keyword = searchParams.get('keyword') || '';
  const filter = searchParams.get('filter') || '';        // newArrival | bestSeller
  const gender = searchParams.get('gender') || '';
  const color = searchParams.get('color') || '';
  const size = searchParams.get('size') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  // On a category route the slug wins; otherwise fall back to a ?category= param.
  const category = routeSlug || searchParams.get('category') || '';

  useSEO({
    title: keyword ? `Search: ${keyword}` : category ? 'Shop the Collection' : 'Shop All',
    description: 'Browse premium shirts and menswear from RICHBAYY — filter by fabric, colour, size and price.',
  });

  // ── Load categories + facets once ─────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [cats, f] = await Promise.all([categoryApi.list(), productApi.facets()]);
        setCategories(cats);
        setFacets({
          colors: f.colors || [],
          sizes: f.sizes || [],
          priceRange: f.priceRange || { min: 0, max: 10000 },
        });
      } catch {
        /* Non-fatal — filters simply render empty. */
      }
    })();
  }, []);

  // ── Fetch products whenever any filter changes ────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        // Build the API params, omitting empties so the query stays clean.
        const params = { page, limit: PAGE_LIMIT, sort };
        if (keyword) params.keyword = keyword;
        if (category) params.category = category;
        if (gender) params.gender = gender;
        if (color) params.color = color;
        if (size) params.size = size;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;
        if (filter === 'newArrival') params.newArrival = 'true';
        if (filter === 'bestSeller') params.bestSeller = 'true';

        const data = await productApi.list(params);
        if (!alive) return;
        setProducts(data.products || []);
        setPageInfo({ page: data.page || 1, pages: data.pages || 1, total: data.total || 0 });
      } catch {
        if (alive) {
          setProducts([]);
          setPageInfo({ page: 1, pages: 1, total: 0 });
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [keyword, category, gender, color, size, sort, page, minPrice, maxPrice, filter]);

  // ── URL helpers ───────────────────────────────────────────────
  // Merge a patch into the current params. Any key set to '' is removed.
  // Changing a filter always resets pagination back to page 1.
  const patchParams = (patch, { resetPage = true } = {}) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v == null) next.delete(k);
      else next.set(k, v);
    });
    if (resetPage && !('page' in patch)) next.delete('page');
    setSearchParams(next);
  };

  // Toggle-style setter: clicking the active value clears it.
  const toggleParam = (key, value) =>
    patchParams({ [key]: searchParams.get(key) === value ? '' : value });

  const clearAll = () => {
    // Preserve keyword only; drop every other refinement.
    const next = new URLSearchParams();
    if (keyword) next.set('keyword', keyword);
    setSearchParams(next);
  };

  const activeFilterCount =
    [category, gender, color, size, minPrice, maxPrice, filter].filter(Boolean).length -
    // The category route param isn't a "removable" chip, so don't count it here.
    (routeSlug && category === routeSlug ? 1 : 0);

  // ── Debounced price inputs ────────────────────────────────────
  // We keep the two number inputs in local state and only push to the URL after
  // the user stops typing, so we don't refetch on every keystroke.
  const [priceDraft, setPriceDraft] = useState({ min: minPrice, max: maxPrice });
  const priceTimer = useRef(null);

  // Keep local drafts in sync if the URL changes elsewhere (e.g. Clear All).
  useEffect(() => { setPriceDraft({ min: minPrice, max: maxPrice }); }, [minPrice, maxPrice]);

  const onPriceChange = (field, value) => {
    const draft = { ...priceDraft, [field]: value };
    setPriceDraft(draft);
    clearTimeout(priceTimer.current);
    priceTimer.current = setTimeout(() => {
      patchParams({ minPrice: draft.min || '', maxPrice: draft.max || '' });
    }, 500);
  };

  // A page-number list for the pagination control.
  const pageNumbers = useMemo(
    () => Array.from({ length: pageInfo.pages }, (_, i) => i + 1),
    [pageInfo.pages],
  );

  // The human-readable title for the current category (for the page heading).
  const categoryName =
    categories.find((c) => c.slug === category)?.name ||
    (filter === 'newArrival' ? 'New Arrivals' : filter === 'bestSeller' ? 'Best Sellers' : 'All Shirts');

  // ── The filter panel (shared between desktop sidebar & mobile drawer) ──
  const FilterPanel = () => (
    <div className="space-y-8">
      {/* Category */}
      <FilterGroup title="Category">
        <ul className="space-y-2">
          <li>
            <Link
              to="/shop"
              onClick={() => setDrawerOpen(false)}
              className={`text-[13.5px] transition-colors hover:text-ink ${!category ? 'font-semibold text-ink' : 'text-muted'}`}
            >
              All Products
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c._id} className="flex items-center justify-between">
              <Link
                to={`/category/${c.slug}`}
                onClick={() => setDrawerOpen(false)}
                className={`text-[13.5px] transition-colors hover:text-ink ${category === c.slug ? 'font-semibold text-ink' : 'text-muted'}`}
              >
                {c.name}
              </Link>
              {typeof c.productCount === 'number' && (
                <span className="text-[12px] text-[#aaa]">{c.productCount}</span>
              )}
            </li>
          ))}
        </ul>
      </FilterGroup>

      {/* Gender */}
      <FilterGroup title="Gender">
        <ul className="space-y-2">
          {GENDERS.map((g) => (
            <li key={g}>
              <button
                onClick={() => toggleParam('gender', g)}
                className="flex items-center gap-2.5 text-[13.5px]"
              >
                <span className={`flex h-[16px] w-[16px] items-center justify-center rounded-[3px] border ${gender === g ? 'border-ink bg-ink' : 'border-[#ccc]'}`}>
                  {gender === g && <CheckIcon size={12} color="#fff" />}
                </span>
                <span className={gender === g ? 'font-medium text-ink' : 'text-muted'}>{g}</span>
              </button>
            </li>
          ))}
        </ul>
      </FilterGroup>

      {/* Colour swatches (facets.colors are colour-name strings) */}
      {facets.colors.length > 0 && (
        <FilterGroup title="Colour">
          <div className="flex flex-wrap gap-2.5">
            {facets.colors.map((c) => {
              const selected = color === c;
              return (
                <button
                  key={c}
                  title={c}
                  aria-label={c}
                  onClick={() => toggleParam('color', c)}
                  className={`h-[26px] w-[26px] rounded-full border transition-transform hover:scale-110 ${selected ? 'ring-2 ring-ink ring-offset-2' : 'border-[#ddd]'}`}
                  style={{ background: c }}
                />
              );
            })}
          </div>
        </FilterGroup>
      )}

      {/* Size chips */}
      {facets.sizes.length > 0 && (
        <FilterGroup title="Size">
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => {
              const selected = size === s;
              return (
                <button
                  key={s}
                  onClick={() => toggleParam('size', s)}
                  className={`min-w-[38px] rounded-[6px] border px-2.5 py-1.5 text-[12.5px] transition-colors ${selected ? 'border-ink bg-ink text-white' : 'border-stone text-ink hover:border-ink'}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </FilterGroup>
      )}

      {/* Price range (two debounced number inputs) */}
      <FilterGroup title="Price">
        <div className="flex items-center gap-2.5">
          <input
            type="number"
            inputMode="numeric"
            min={facets.priceRange.min}
            max={facets.priceRange.max}
            placeholder={fmtPrice(facets.priceRange.min)}
            value={priceDraft.min}
            onChange={(e) => onPriceChange('min', e.target.value)}
            className="field w-full !py-2 text-[13px]"
            aria-label="Minimum price"
          />
          <span className="text-[#bbb]">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={facets.priceRange.min}
            max={facets.priceRange.max}
            placeholder={fmtPrice(facets.priceRange.max)}
            value={priceDraft.max}
            onChange={(e) => onPriceChange('max', e.target.value)}
            className="field w-full !py-2 text-[13px]"
            aria-label="Maximum price"
          />
        </div>
        <div className="mt-2 text-[12px] text-muted">
          Range {fmtPrice(facets.priceRange.min)} – {fmtPrice(facets.priceRange.max)}
        </div>
      </FilterGroup>

      {activeFilterCount > 0 && (
        <button onClick={clearAll} className="text-[13px] font-medium text-gold underline underline-offset-2">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="px-5 py-8 sm:px-8 lg:px-10">
      {/* Page heading */}
      <div className="mb-6">
        <nav className="mb-2 text-[12px] tracking-[0.5px] text-muted">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span className="mx-1.5">/</span>
          <Link to="/shop" className="hover:text-ink">Shop</Link>
          {category && (
            <>
              <span className="mx-1.5">/</span>
              <span className="text-ink">{categoryName}</span>
            </>
          )}
        </nav>
        <h1 className="text-[26px] font-medium tracking-[0.3px] sm:text-[30px]">
          {keyword ? `Results for “${keyword}”` : categoryName}
        </h1>
      </div>

      <div className="flex gap-8">
        {/* ── Desktop sidebar ─────────────────────────── */}
        <aside className="hidden w-[230px] shrink-0 lg:block">
          <FilterPanel />
        </aside>

        {/* ── Main column ─────────────────────────────── */}
        <div className="min-w-0 flex-1">
          {/* Top bar: count + filters button (mobile) + sort + view toggle */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-stone pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDrawerOpen(true)}
                className="btn-outline flex items-center gap-2 !px-4 !py-2 text-[13px] lg:hidden"
              >
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[11px] text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <span className="text-[13px] text-muted">
                {loading ? 'Loading…' : `${pageInfo.total} product${pageInfo.total === 1 ? '' : 's'}`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Sort */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => patchParams({ sort: e.target.value })}
                  className="appearance-none rounded-[8px] border border-stone bg-paper py-2 pl-3.5 pr-8 text-[13px] focus:border-ink focus:outline-none"
                  aria-label="Sort products"
                >
                  {SORTS.map(([v, label]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <CaretDown size={9} />
                </span>
              </div>

              {/* Grid / list toggle */}
              <div className="hidden items-center rounded-[8px] border border-stone sm:flex">
                <button
                  onClick={() => setView('grid')}
                  aria-label="Grid view"
                  className={`flex h-[34px] w-[34px] items-center justify-center rounded-l-[7px] ${view === 'grid' ? 'bg-ink text-white' : 'text-muted'}`}
                >
                  <GridGlyph />
                </button>
                <button
                  onClick={() => setView('list')}
                  aria-label="List view"
                  className={`flex h-[34px] w-[34px] items-center justify-center rounded-r-[7px] ${view === 'list' ? 'bg-ink text-white' : 'text-muted'}`}
                >
                  <ListGlyph />
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <ProductGridSkeleton count={PAGE_LIMIT} />
          ) : products.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone bg-sand py-20 text-center">
              <div className="mb-3 text-5xl">🧺</div>
              <h3 className="mb-1 text-[17px] font-semibold">No products found</h3>
              <p className="mb-5 max-w-sm text-[13.5px] text-muted">
                Try adjusting or clearing your filters to see more of the collection.
              </p>
              <button onClick={clearAll} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <div
              className={
                view === 'grid'
                  ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'
                  : 'grid grid-cols-1 gap-4'
              }
            >
              {products.map((p) => (
                <div key={p._id}>
                  <ProductCard
                    product={p}
                    badge={p.isNewArrival ? 'NEW' : p.isBestSeller ? 'BEST SELLER' : undefined}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && pageInfo.pages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => patchParams({ page: String(page - 1) }, { resetPage: false })}
                className="rounded-[7px] border border-stone px-3.5 py-2 text-[13px] transition-colors enabled:hover:border-ink disabled:opacity-40"
              >
                Prev
              </button>
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  onClick={() => patchParams({ page: String(n) }, { resetPage: false })}
                  className={`h-[36px] w-[36px] rounded-[7px] text-[13px] transition-colors ${n === page ? 'bg-ink text-white' : 'border border-stone hover:border-ink'}`}
                >
                  {n}
                </button>
              ))}
              <button
                disabled={page >= pageInfo.pages}
                onClick={() => patchParams({ page: String(page + 1) }, { resetPage: false })}
                className="rounded-[7px] border border-stone px-3.5 py-2 text-[13px] transition-colors enabled:hover:border-ink disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile filter drawer ──────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-[300px] max-w-[85vw] overflow-y-auto bg-paper p-6 shadow-lift lg:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="heading">Filters</span>
                <button onClick={() => setDrawerOpen(false)} aria-label="Close filters" className="text-2xl leading-none text-muted">
                  ×
                </button>
              </div>
              <FilterPanel />
              <button onClick={() => setDrawerOpen(false)} className="btn-primary mt-8 w-full">
                Show {pageInfo.total} results
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Small presentational helpers ────────────────────────────────

// A titled filter section with a subtle divider.
function FilterGroup({ title, children }) {
  return (
    <div>
      <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[1.2px] text-ink">{title}</h3>
      {children}
    </div>
  );
}

// Tiny inline glyphs for the grid / list toggle.
const GridGlyph = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const ListGlyph = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
