import { useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Inbox } from 'lucide-react';
import { Skeleton } from './Skeleton';

export type Column<T> = {
  key: string;
  header: string;
  align?: 'left' | 'right';
  width?: string;
  sortable?: boolean;
  sortValue?: (row: T) => number | string;
  render: (row: T) => React.ReactNode;
  sticky?: boolean; // pins this column (typically the first, e.g. Name) on horizontal scroll
};

// The one table component every data-heavy page should use. Handles sticky header,
// an optional sticky first column, client-side sort, row hover actions, and the
// standard loading/empty states — so no page hand-rolls its own <table> again.
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  emptyMessage = 'No data found.',
  emptyIcon: EmptyIcon = Inbox,
  rowActions,
  onRowClick,
  minWidth = '900px',
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: any;
  rowActions?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  minWidth?: string;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      const cmp = av > bv ? 1 : av < bv ? -1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir, columns]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full text-body" style={{ minWidth }}>
        <thead>
          <tr className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-5 py-3 text-caption font-medium uppercase tracking-wide text-muted
                  ${col.align === 'right' ? 'text-right' : 'text-left'}
                  ${col.sticky ? 'sticky left-0 z-20 bg-background/95' : ''}`}
                style={{ width: col.width }}
              >
                {col.sortable ? (
                  <button
                    onClick={() => toggleSort(col.key)}
                    className="inline-flex items-center gap-1 hover:text-ink"
                  >
                    {col.header}
                    {sortKey === col.key ? (
                      sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                    ) : (
                      <ArrowUpDown size={11} className="opacity-40" />
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
            {rowActions && <th className="px-5 py-3" />}
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-3.5">
                    <Skeleton className="h-4 w-3/4" />
                  </td>
                ))}
                {rowActions && <td className="px-5 py-3.5" />}
              </tr>
            ))}

          {!loading && sortedRows.length === 0 && (
            <tr>
              <td colSpan={columns.length + (rowActions ? 1 : 0)}>
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <EmptyIcon size={22} className="text-muted" strokeWidth={1.5} />
                  <p className="text-body text-muted">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          )}

          {!loading &&
            sortedRows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={`group border-b border-border last:border-0 transition-colors duration-fast hover:bg-accentSoft/40
                  ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-5 py-3.5 ${col.align === 'right' ? 'text-right' : 'text-left'}
                      ${col.sticky ? 'sticky left-0 z-10 bg-surface group-hover:bg-accentSoft/40' : ''}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
                {rowActions && (
                  <td className="px-5 py-3.5 text-right opacity-0 transition-opacity duration-fast group-hover:opacity-100">
                    {rowActions(row)}
                  </td>
                )}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
