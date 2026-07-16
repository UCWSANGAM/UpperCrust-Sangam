import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-xs">
      <div className="flex items-start justify-between">
        <p className="text-caption font-semibold uppercase tracking-wide text-muted">{label}</p>
        {Icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accentSoft">
            <Icon size={14} className="text-accentDark" strokeWidth={2} />
          </div>
        )}
      </div>
      <p className="mt-2 font-display text-[26px] leading-tight text-ink">{value}</p>
      {(sub || trend) && (
        <div className="mt-1 flex items-center gap-2">
          {trend && (
            <span className={`flex items-center gap-0.5 text-caption font-medium ${trend.positive ? 'text-success' : 'text-danger'}`}>
              {trend.positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {trend.value}
            </span>
          )}
          {sub && <p className="text-caption text-muted">{sub}</p>}
        </div>
      )}
    </div>
  );
}

// The big, single-focal-point number — for the Dashboard hero and any page with
// one metric that matters more than the rest (Sales team AUM, Portfolio total, etc.)
export function HeroKPI({
  label,
  value,
  sub,
  sideStats,
}: {
  label: string;
  value: string;
  sub?: string;
  sideStats?: { label: string; value: string }[];
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-7 shadow-xs">
      <div>
        <p className="text-caption font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-1.5 font-display text-hero leading-none text-ink">{value}</p>
        {sub && <p className="mt-2 text-label font-medium text-success">{sub}</p>}
      </div>
      {sideStats && sideStats.length > 0 && (
        <div className="flex gap-8">
          {sideStats.map((s) => (
            <div key={s.label} className="text-right">
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted">{s.label}</p>
              <p className="mt-1 text-[20px] font-semibold text-ink">{s.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const TONE_STYLES = {
  warning: 'border-warning/30 bg-warningSoft text-accentDark',
  danger: 'border-danger/30 bg-dangerSoft text-danger',
  info: 'border-info/30 bg-infoSoft text-info',
  success: 'border-success/30 bg-successSoft text-success',
};

// Dismissible attention strip — for the Dashboard "needs attention" row
// (overdue reviews, urgent tickets, large redemptions).
export function AlertChip({
  label,
  tone = 'warning',
  onClick,
}: {
  label: string;
  tone?: keyof typeof TONE_STYLES;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border px-3 py-1.5
        text-caption font-medium transition-opacity duration-fast hover:opacity-80 ${TONE_STYLES[tone]}`}
    >
      ⚠ {label}
    </button>
  );
}
