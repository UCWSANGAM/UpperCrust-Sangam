import { useState } from 'react';

export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap
            rounded bg-sidebar px-2 py-1 text-[11px] text-white shadow-md
            after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-4
            after:border-transparent after:border-t-sidebar"
        >
          {label}
        </span>
      )}
    </span>
  );
}

export function Popover({
  trigger,
  children,
  open,
  onOpenChange,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <div className="relative inline-block">
      <div onClick={() => onOpenChange(!open)}>{trigger}</div>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => onOpenChange(false)} />
          <div className="absolute right-0 z-50 mt-2 min-w-[200px] rounded-md border border-border bg-surface p-1.5 shadow-lg">
            {children}
          </div>
        </>
      )}
    </div>
  );
}
