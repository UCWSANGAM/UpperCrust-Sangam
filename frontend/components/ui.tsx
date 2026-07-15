import { LucideIcon } from 'lucide-react';

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

const BADGE_STYLES: Record<string, string> = {
  gold: 'bg-accent/10 text-accentDark border-accent/30',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
};

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
