'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

type Due = {
  year: number;
  quarter: number;
  pending: { id: string; name: string; aum: number | null }[];
  completed: number;
  total: number;
};

function formatCr(value: number | null) {
  if (!value) return '—';
  return `₹${(value / 10000000).toFixed(2)} Cr`;
}

export default function ReviewsPage() {
  const [due, setDue] = useState<Due | null>(null);

  useEffect(() => {
    api.get('/reviews/due').then(({ data }) => setDue(data));
  }, []);

  if (!due) return <div className="p-8 text-sm text-muted">Loading...</div>;

  const progress = due.total === 0 ? 0 : Math.round((due.completed / due.total) * 100);

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl text-ink">Quarterly reviews</h1>
      <p className="mt-1 text-sm text-muted">
        Q{due.quarter} {due.year} — {due.completed} of {due.total} clients reviewed ({progress}%)
      </p>

      <div className="mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-border">
        <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
      </div>

      <h2 className="mt-8 font-display text-lg text-ink">Pending review ({due.pending.length})</h2>
      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background/50 text-left text-xs uppercase text-muted">
              <th className="px-4 py-3">Investor</th>
              <th className="px-4 py-3 text-right">AUM</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {due.pending.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted">
                  All caught up for this quarter.
                </td>
              </tr>
            )}
            {due.pending.map((inv) => (
              <tr key={inv.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-ink">{inv.name}</td>
                <td className="px-4 py-3 text-right font-display text-ink">{formatCr(inv.aum)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/investors/${inv.id}`} className="text-xs text-accent hover:underline">
                    Review now
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
