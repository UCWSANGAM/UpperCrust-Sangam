import { Search, Command } from 'lucide-react';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props;
  return (
    <input
      className={`w-full rounded-md border border-border bg-background px-3 py-2 text-body text-ink
        outline-none transition-colors duration-fast placeholder:text-mutedSoft
        focus:border-accent focus:shadow-focus ${className}`}
      {...rest}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...rest } = props;
  return (
    <textarea
      className={`w-full rounded-md border border-border bg-background px-3 py-2 text-body text-ink
        outline-none transition-colors duration-fast placeholder:text-mutedSoft
        focus:border-accent focus:shadow-focus ${className}`}
      {...rest}
    />
  );
}

export function SearchInput({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`relative ${className}`}>
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mutedSoft" />
      <Input className="pl-9" {...props} />
    </div>
  );
}

// Sits in the top bar — click or ⌘K opens the real CommandPalette overlay.
export function CommandSearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-64 items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5
        text-caption text-mutedSoft transition-colors duration-fast hover:border-accent hover:text-muted"
    >
      <Search size={13} />
      <span className="flex-1 text-left">Search everything...</span>
      <span className="flex items-center gap-0.5 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px]">
        <Command size={9} />K
      </span>
    </button>
  );
}
