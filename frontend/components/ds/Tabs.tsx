export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`relative px-3 py-2.5 text-body font-medium transition-colors duration-fast ${
            active === tab.key ? 'text-ink' : 'text-muted hover:text-ink'
          }`}
        >
          {tab.label}
          {active === tab.key && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-accent" />}
        </button>
      ))}
    </div>
  );
}
