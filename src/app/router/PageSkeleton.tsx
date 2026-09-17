/** Placeholder saat bundel halaman masih dimuat. */
export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-52 animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
      <div className="grid gap-4 pt-3 sm:grid-cols-3">
        {[0, 1, 2].map(index => (
          <div key={index} className="h-28 animate-pulse rounded-xl bg-white ring-1 ring-slate-200" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl bg-white ring-1 ring-slate-200" />
    </div>
  )
}
