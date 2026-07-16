import { useState } from 'react';

export type KanbanColumn = { key: string; label: string; accent?: string };
export type KanbanItem = { id: string; columnKey: string };

// One reusable board used by both Tasks and Tickets — drag a card between columns,
// parent owns the actual status-update API call via onMove.
export function KanbanBoard<T extends KanbanItem>({
  columns,
  items,
  renderCard,
  onMove,
}: {
  columns: KanbanColumn[];
  items: T[];
  renderCard: (item: T) => React.ReactNode;
  onMove: (itemId: string, newColumnKey: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
      {columns.map((col) => {
        const colItems = items.filter((i) => i.columnKey === col.key);
        return (
          <div
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(col.key);
            }}
            onDragLeave={() => setOverCol(null)}
            onDrop={() => {
              if (dragId) onMove(dragId, col.key);
              setDragId(null);
              setOverCol(null);
            }}
            className={`rounded-lg border p-3 transition-colors duration-fast ${
              overCol === col.key ? 'border-accent bg-accentSoft/40' : 'border-border bg-background/50'
            }`}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-caption font-semibold uppercase tracking-wide text-muted">{col.label}</p>
              <span className="rounded-pill bg-border/60 px-1.5 py-0.5 text-[10px] font-medium text-muted">{colItems.length}</span>
            </div>
            <div className="space-y-2 min-h-[40px]">
              {colItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDragId(item.id)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  {renderCard(item)}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function KanbanCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3 text-body shadow-xs transition-shadow duration-fast hover:shadow-sm">
      {children}
    </div>
  );
}
