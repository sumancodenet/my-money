export const SkeletonBlock = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`} />
);

export default function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 min-w-0 w-full max-w-full overflow-x-hidden">
      {/* Header skeleton */}
      <div className="space-y-3">
        <SkeletonBlock className="h-7 w-52" />
        <SkeletonBlock className="h-4 w-72" />
        <div className="flex gap-2 flex-wrap">
          <SkeletonBlock className="h-9 w-24" />
          <SkeletonBlock className="h-9 w-24" />
          <SkeletonBlock className="h-9 w-32" />
        </div>
      </div>
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card p-4 sm:p-5">
            <div className="flex justify-between gap-3">
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="h-6 w-28" />
                <SkeletonBlock className="h-3 w-24" />
              </div>
              <SkeletonBlock className="h-10 w-10 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="card p-4 sm:p-6 lg:col-span-2">
          <SkeletonBlock className="h-5 w-44 mb-4" />
          <SkeletonBlock className="h-[220px] sm:h-[260px] w-full" />
        </div>
        <div className="card p-4 sm:p-6">
          <SkeletonBlock className="h-5 w-36 mb-4" />
          <SkeletonBlock className="h-[220px] sm:h-[260px] w-full rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="card p-4 sm:p-6 lg:col-span-2">
          <SkeletonBlock className="h-5 w-44 mb-4" />
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-8 w-full" />)}</div>
        </div>
        <div className="card p-4 sm:p-6">
          <SkeletonBlock className="h-5 w-36 mb-4" />
          <SkeletonBlock className="h-[220px] sm:h-[260px] w-full" />
        </div>
      </div>
    </div>
  );
}

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="space-y-3 py-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <SkeletonBlock className="h-4 w-16" />
        <SkeletonBlock className="h-4 flex-1" />
        <SkeletonBlock className="h-4 w-20" />
      </div>
    ))}
  </div>
);

export const CardGridSkeleton = ({ count = 6 }) => (
  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card p-5 space-y-3">
        <SkeletonBlock className="h-10 w-10 rounded-xl" />
        <SkeletonBlock className="h-5 w-32" />
        <SkeletonBlock className="h-4 w-48" />
        <SkeletonBlock className="h-6 w-24" />
      </div>
    ))}
  </div>
);
