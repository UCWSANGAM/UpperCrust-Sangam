import { ChevronRight } from 'lucide-react';

export function Breadcrumb({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-caption text-muted">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={11} />}
          {item.onClick ? (
            <button onClick={item.onClick} className="hover:text-ink">
              {item.label}
            </button>
          ) : (
            <span className={i === items.length - 1 ? 'text-ink' : ''}>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

export type FilterOption = { key: string; label: string };

// Reusable filter-chip row — used on Investors, Tickets, Tasks list views.
export function FilterChipBar({
  options,
  active,
  onChange,
}: {
  options: FilterOption[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`rounded-pill border px-3 py-1.5 text-caption font-medium transition-colors duration-fast ${
            active === opt.key
              ? 'border-accent bg-accentSoft text-accentDark'
              : 'border-border text-muted hover:border-accent hover:text-ink'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
