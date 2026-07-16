// Reusable page-level layouts. Every future page composes one of these instead of
// hand-rolling its own <div className="p-8"> wrapper.

export function ListLayout({
  header,
  filters,
  children,
}: {
  header: React.ReactNode;
  filters?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="p-8">
      {header}
      {filters && <div className="mb-5">{filters}</div>}
      {children}
    </div>
  );
}

// Left: fixed-width detail/identity rail (stays visible). Right: scrollable content
// with anchored sections. This is the Client-360 pattern — never lose the client's
// identity/key numbers while reading their portfolio, activity, or reviews.
export function MasterDetailLayout({
  rail,
  children,
}: {
  rail: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-8 p-8">
      <div className="sticky top-[70px] h-fit w-72 shrink-0">{rail}</div>
      <div className="min-w-0 flex-1 space-y-8">{children}</div>
    </div>
  );
}

export function SplitLayout({ left, right, leftWidth = 'w-96' }: { left: React.ReactNode; right: React.ReactNode; leftWidth?: string }) {
  return (
    <div className="flex h-full">
      <div className={`${leftWidth} shrink-0 overflow-y-auto border-r border-border`}>{left}</div>
      <div className="flex-1 overflow-y-auto">{right}</div>
    </div>
  );
}

export function SettingsLayout({
  nav,
  children,
}: {
  nav: { key: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-8 p-8">
      <div className="w-48 shrink-0 space-y-0.5">
        {nav.map((item) => (
          <div key={item.key} className="rounded-md px-3 py-2 text-body text-muted hover:bg-accentSoft hover:text-ink">
            {item.label}
          </div>
        ))}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
