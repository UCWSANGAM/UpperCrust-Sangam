export type ActivityEntry = {
  id: string;
  actor: string;
  content: string;
  timestamp: string;
  icon?: React.ReactNode;
};

// Chronological feed used on the Dashboard "Recent Activity" section and the
// Investor "Activity" tab — one component, two contexts.
export function ActivityFeed({ items }: { items: ActivityEntry[] }) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-body text-muted">Nothing here yet.</p>;
  }

  return (
    <div className="relative">
      <div className="absolute bottom-0 left-[15px] top-0 w-px bg-border" />
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="relative flex gap-3 pl-0">
            <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-caption font-semibold text-accentDark">
              {item.icon || item.actor.charAt(0)}
            </div>
            <div className="flex-1 pb-1 pt-1">
              <div className="flex items-baseline justify-between">
                <span className="text-body font-medium text-ink">{item.actor}</span>
                <span className="text-caption text-mutedSoft">{item.timestamp}</span>
              </div>
              <p className="text-body text-muted">{item.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
