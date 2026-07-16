function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

const RANK_MEDAL: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };

// Ranked RM/team performance card — used on Dashboard (compact) and Sales (full).
export function LeaderboardCard({
  rank,
  name,
  value,
  valueLabel,
  pct,
  barColor = '#B8935A',
}: {
  rank: number;
  name: string;
  value: string;
  valueLabel?: string;
  pct: number;
  barColor?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-5 shrink-0 text-center text-body">{RANK_MEDAL[rank] || rank + 1}</span>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar text-caption font-semibold text-accent">
        {initials(name)}
      </div>
      <span className="w-28 shrink-0 truncate text-body text-ink">{name}</span>
      <div className="relative h-6 flex-1 overflow-hidden rounded bg-background">
        <div className="h-full rounded transition-all duration-slow" style={{ width: `${Math.max(6, pct)}%`, backgroundColor: barColor }} />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-caption font-medium text-ink">{value}</span>
      </div>
      {valueLabel && <span className="w-16 shrink-0 text-right text-caption text-muted">{valueLabel}</span>}
    </div>
  );
}
