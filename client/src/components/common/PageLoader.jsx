// components/common/PageLoader.jsx
// Full-viewport brand loader used for route Suspense fallbacks + auth checks.
export default function PageLoader() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-stone border-t-ink" />
      <span className="text-xs tracking-[4px] text-muted">RICHBAYY</span>
    </div>
  );
}
