'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, PageHeader, Badge, Avatar } from '@/components/ui';

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

function xirrTone(x?: number): 'green' | 'red' | 'gray' {
  if (x === undefined || x === null) return 'gray';
  return x >= 0 ? 'green' : 'red';
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
      <PageHeader title="Investors" subtitle={`${investors.length} investors in your book`} />

      <div className="relative mb-5 max-w-sm">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-[13px] outline-none focus:border-accent"
        />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-background/60 text-left text-[11px] font-medium uppercase tracking-wide text-muted">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Family Group</th>
              <th className="px-5 py-3 text-right">Total AUM</th>
              <th className="px-5 py-3 text-right">XIRR</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted">Loading...</td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted">
                  No investors found. Upload your investor data under Data Import.
                </td>
              </tr>
            )}
            {filtered.map((inv) => (
              <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-background/50">
                <td className="px-5 py-3">
                  <Link href={`/investors/${inv.id}`} className="flex items-center gap-3 group">
                    <Avatar name={inv.name} />
                    <span className="font-medium text-ink group-hover:text-accentDark">{inv.name}</span>
                  </Link>
                </td>
                <td className="px-5 py-3">
                  {inv.familyGroup ? <Badge tone="gray">{inv.familyGroup}</Badge> : <span className="text-muted">—</span>}
                </td>
                <td className="px-5 py-3 text-right font-display text-[14px] text-ink">{formatCr(inv.totalMfAum)}</td>
                <td className="px-5 py-3 text-right">
                  {inv.xirrTotal ? (
                    <Badge tone={xirrTone(inv.xirrTotal)}>{inv.xirrTotal.toFixed(2)}%</Badge>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
