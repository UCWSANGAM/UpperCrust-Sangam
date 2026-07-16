export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-border/70 ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-7 w-32" />
    </div>
  );
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="space-y-2.5" style={{ height }}>
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-full w-full" />
    </div>
  );
}
