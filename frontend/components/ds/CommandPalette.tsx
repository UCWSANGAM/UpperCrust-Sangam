'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, ClipboardCheck, Ticket as TicketIcon, CalendarClock, UserCog } from 'lucide-react';

// UI-only for now — static section labels, no backend search wired yet (per Phase 2
// scope: "Build only UI"). Opens on ⌘K / Ctrl+K from anywhere, and via the top-bar trigger.
const SECTIONS = [
  { label: 'Clients', icon: Users, placeholder: 'Search investors by name...' },
  { label: 'Tasks & Meetings', icon: CalendarClock, placeholder: 'Search tasks...' },
  { label: 'Tickets', icon: TicketIcon, placeholder: 'Search tickets...' },
  { label: 'Reviews', icon: ClipboardCheck, placeholder: 'Search reviews...' },
  { label: 'Users', icon: UserCog, placeholder: 'Search team members...' },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/40 pt-[15vh]" onClick={onClose}>
      <div
        className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Search size={16} className="text-mutedSoft" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, tasks, tickets, reviews, users..."
            className="flex-1 bg-transparent text-body text-ink outline-none placeholder:text-mutedSoft"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-mutedSoft">esc</kbd>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim() === '' ? (
            <div className="px-3 py-8 text-center text-body text-muted">
              Start typing to search across the whole app.
              <p className="mt-1 text-caption text-mutedSoft">Full search wiring lands with each module rebuild.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {SECTIONS.map((section) => (
                <div
                  key={section.label}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-body text-muted hover:bg-accentSoft hover:text-ink"
                >
                  <section.icon size={15} />
                  Search &ldquo;{query}&rdquo; in {section.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook: wires the global ⌘K / Ctrl+K shortcut. Call once in the app shell.
export function useCommandPaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpen();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpen]);
}
