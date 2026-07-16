import { LucideIcon, Inbox } from 'lucide-react';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-surface shadow-xs ${className}`}>
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
        <h1 className="font-display text-page text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-body text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionHeader({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-section text-ink">{children}</h2>
      {action}
    </div>
  );
}

const BADGE_STYLES = {
  gold: 'bg-warningSoft text-accentDark border-warning/30',
  green: 'bg-successSoft text-success border-success/30',
  red: 'bg-dangerSoft text-danger border-danger/30',
  blue: 'bg-infoSoft text-info border-info/30',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
};

// Semantic tone guide: green = positive/holds/complete · red = negative/overdue
// gold = pending/opportunity · blue = informational · gray = neutral/unclassified
export function Badge({ children, tone = 'gray' }: { children: React.ReactNode; tone?: keyof typeof BADGE_STYLES }) {
  return (
    <span className={`inline-flex items-center rounded-pill border px-2.5 py-0.5 text-caption font-medium ${BADGE_STYLES[tone]}`}>
      {children}
    </span>
  );
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const dim = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-caption';
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-sidebar font-semibold text-accent ${dim}`}>
      {initials}
    </div>
  );
}

export function EmptyState({ message, icon: Icon = Inbox }: { message: string; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <Icon size={22} className="text-muted" strokeWidth={1.5} />
      <p className="text-body text-muted">{message}</p>
    </div>
  );
}

export function ChartCard({ title, icon: Icon, children }: { title: string; icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2.5">
        {Icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accentSoft">
            <Icon size={14} className="text-accentDark" strokeWidth={2} />
          </div>
        )}
        <p className="text-title text-ink">{title}</p>
      </div>
      {children}
    </Card>
  );
}
