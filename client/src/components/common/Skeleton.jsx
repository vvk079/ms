// components/common/Skeleton.jsx
// Shimmer skeletons (see .skeleton in index.css). Used while data loads to keep
// layout stable and give the premium "loading" feel from the brief.
export const Skeleton = ({ className = '' }) => <div className={`skeleton rounded-md ${className}`} />;

// A product-card-shaped skeleton for grids.
export const ProductCardSkeleton = () => (
  <div>
    <Skeleton className="h-[300px] w-full rounded-[10px]" />
    <Skeleton className="mt-3 h-4 w-3/4" />
    <Skeleton className="mt-2 h-4 w-1/3" />
    <div className="mt-3 flex gap-1.5">
      <Skeleton className="h-4 w-4 rounded-full" />
      <Skeleton className="h-4 w-4 rounded-full" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </div>
  </div>
);

// A grid of N card skeletons.
export const ProductGridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
    {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
  </div>
);
