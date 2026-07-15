import { LucideIcon, Inbox } from 'lucide-react';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(31,36,48,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-start justify-between">
      <div>
        <h1 className="font-display text-[28px] leading-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// Section-level heading used above tables/lists within a page (below PageHeader) —
// standardizes the "AUM by family group" / "Pending review" / "Top holdings" style headers.
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 font-display text-[20px] text-ink">{children}</h2>;
}

const BADGE_STYLES: Record<string, string> = {
  gold: 'bg-accent/10 text-accentDark border-accent/30',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
};

// Semantic tone guide (keep consistent across the app):
// green = positive / holds / completed · red = negative / redemption / overdue
// gold  = pending / opportunity / attention needed · blue = informational / neutral highlight
// gray  = default / unclassified
export function Badge({ children, tone = 'gray' }: { children: React.ReactNode; tone?: keyof typeof BADGE_STYLES }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${BADGE_STYLES[tone]}`}>
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
        {Icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
            <Icon size={14} className="text-accentDark" strokeWidth={2} />
          </div>
        )}
      </div>
      <p className="mt-2 font-display text-[26px] leading-tight text-ink">{value}</p>
      {sub && <p className="mt-1 text-[12px] text-muted">{sub}</p>}
    </Card>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar text-[11px] font-semibold text-accent">
      {initials}
    </div>
  );
}

// Shared wrapper for every chart on every page — icon badge + title, one consistent
// header treatment instead of each page rolling its own.
export function ChartCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2.5">
        {Icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/12">
            <Icon size={14} className="text-accentDark" strokeWidth={2} />
          </div>
        )}
        <p className="text-[15px] font-medium text-ink">{title}</p>
      </div>
      {children}
    </Card>
  );
}

// Consistent "no data yet" state — used instead of each page writing its own plain
// text message in a table cell or blank area.
export function EmptyState({ message, icon: Icon = Inbox }: { message: string; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <Icon size={22} className="text-muted" strokeWidth={1.5} />
      <p className="text-[13px] text-muted">{message}</p>
    </div>
  );
}

// Shimmer placeholder shown while a chart/table's data is loading, instead of a
// blank area or a plain "Loading..." string.
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-border/70 ${className}`} />;
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="space-y-2.5" style={{ height }}>
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-full w-full" />
    </div>
  );
}
