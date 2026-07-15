'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

type Investor = {
  id: string;
  name: string;
  familyGroup?: string;
  totalMfAum?: number;
  xirrTotal?: number;
};

function formatCr(value?: number) {
  if (!value) return '—';
  return `₹${(value / 10000000).toFixed(2)} Cr`;
}

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/investors')
      .then(({ data }) => setInvestors(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = investors.filter((inv) =>
    inv.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl text-ink">Investors</h1>
      <p className="mt-1 text-sm text-muted">{investors.length} investors in your book</p>

      <input
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-6 w-full max-w-sm rounded border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />

      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background/50 text-left text-xs uppercase text-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Family Group</th>
              <th className="px-4 py-3 text-right">Total AUM</th>
              <th className="px-4 py-3 text-right">XIRR</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">Loading...</td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  No investors found. Upload your Investor List under Data Import.
                </td>
              </tr>
            )}
            {filtered.map((inv) => (
              <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-background/40">
                <td className="px-4 py-3">
                  <Link href={`/investors/${inv.id}`} className="font-medium text-ink hover:text-accent">
                    {inv.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{inv.familyGroup || '—'}</td>
                <td className="px-4 py-3 text-right font-display text-ink">{formatCr(inv.totalMfAum)}</td>
                <td className="px-4 py-3 text-right text-muted">
                  {inv.xirrTotal ? `${inv.xirrTotal.toFixed(2)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
