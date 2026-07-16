import { X } from 'lucide-react';
import { useEffect } from 'react';
import { IconButton } from './Button';

function useEscapeClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);
}

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'max-w-md',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}) {
  useEscapeClose(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 animate-in fade-in duration-fast">
      <div className={`w-full ${width} rounded-lg border border-border bg-surface shadow-lg`}>
        {title && (
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <p className="text-title text-ink">{title}</p>
            <IconButton icon={X} size="sm" onClick={onClose} />
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// Slides in from the right — used for quick-edit / quick-create without leaving the page,
// per the "never lose context" principle from the Client 360 workspace direction.
export function Drawer({
  open,
  onClose,
  title,
  children,
  width = 'max-w-md',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}) {
  useEscapeClose(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/30">
      <div className={`h-full w-full ${width} overflow-y-auto border-l border-border bg-surface shadow-lg`}>
        {title && (
          <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-5 py-4">
            <p className="text-title text-ink">{title}</p>
            <IconButton icon={X} size="sm" onClick={onClose} />
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
