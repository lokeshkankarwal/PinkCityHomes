interface SkeletonProps {
  className?: string;
  count?: number;
}

export function SkeletonLine({ className = "h-4 w-full" }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function SkeletonCard({ count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-card space-y-4"
        >
          <div className="skeleton aspect-[16/10] w-full rounded-2xl" />
          <div className="space-y-2">
            <SkeletonLine className="h-6 w-3/4" />
            <SkeletonLine className="h-4 w-1/2" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <SkeletonLine className="h-4 w-16" />
            <SkeletonLine className="h-4 w-16" />
            <SkeletonLine className="h-4 w-20" />
          </div>
          <div className="pt-2 flex items-center justify-between">
            <SkeletonLine className="h-8 w-24 rounded-xl" />
            <SkeletonLine className="h-8 w-28 rounded-xl" />
          </div>
        </div>
      ))}
    </>
  );
}

export function SkeletonStatCard({ count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card space-y-3"
        >
          <SkeletonLine className="h-3 w-1/3" />
          <SkeletonLine className="h-8 w-1/2" />
          <SkeletonLine className="h-3 w-2/3" />
        </div>
      ))}
    </>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-card p-4 space-y-3">
      <div className="flex gap-4 pb-3 border-b border-slate-100">
        {Array.from({ length: cols }).map((_, c) => (
          <SkeletonLine key={c} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-3 border-b border-slate-50 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfileCard() {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card flex items-center gap-4">
      <div className="skeleton h-16 w-16 rounded-full flex-shrink-0" />
      <div className="space-y-2 flex-1">
        <SkeletonLine className="h-5 w-1/3" />
        <SkeletonLine className="h-3 w-1/2" />
        <SkeletonLine className="h-3 w-1/4" />
      </div>
    </div>
  );
}
