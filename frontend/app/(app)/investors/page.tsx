'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, BarChart3, PieChart as PieIcon } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '@/lib/api';
import { Card, PageHeader, Badge, Avatar, ChartCard, EmptyState } from '@/components/ui';

type Investor = {
  id: string;
  name: string;
  familyGroup?: string;
  totalMfAum?: number;
  xirrTotal?: number;
};

const GOLD = '#B8935A';
const NAVY = '#14171B';

function formatCr(value?: number) {
  if (!value) return '—';
  return `₹${(value / 10000000).toFixed(2)} Cr`;
}

function xirrTone(x?: number): 'green' | 'red' | 'gray' {
  if (x === undefined || x === null) return 'gray';
  return x >= 0 ? 'green' : 'red';
}

const TIERS = [
  { label: '< 25L', min: 0, max: 2500000 },
  { label: '25L–1Cr', min: 2500000, max: 10000000 },
  { label: '1Cr–5Cr', min: 10000000, max: 50000000 },
  { label: '5Cr–10Cr', min: 50000000, max: 100000000 },
  { label: '10Cr+', min: 100000000, max: Infinity },
];

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [taxStatus, setTaxStatus] = useState<{ name: string; count: number; aum: number }[]>([]);

  useEffect(() => {
    api
      .get('/investors')
      .then(({ data }) => setInvestors(data))
      .finally(() => setLoading(false));
    api.get('/investors/tax-status').then(({ data }) => setTaxStatus(data)).catch(() => {});
  }, []);

  const filtered = investors.filter((inv) =>
    inv.name.toLowerCase().includes(search.toLowerCase()),
  );

  const tierData = useMemo(() => {
    return TIERS.map((tier) => ({
      label: tier.label,
      count: investors.filter((i) => {
        const aum = i.totalMfAum || 0;
        return aum >= tier.min && aum < tier.max;
      }).length,
    }));
  }, [investors]);

  return (
    <div className="p-8">
      <PageHeader title="Investors" subtitle={`${investors.length} investors in your book`} />

      {investors.length > 0 && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <ChartCard title="Investors by AUM tier" icon={BarChart3}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={tierData}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {tierData.map((_, i) => (
                    <Cell key={i} fill={i === tierData.length - 1 ? NAVY : GOLD} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {taxStatus.length > 0 && (
            <ChartCard title="Investors by tax status" icon={PieIcon}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={taxStatus.map((t) => ({ name: t.name, value: t.count }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={62}
                    paddingAngle={2}
                    label={({ name, value }) => `${name} ${value}`}
                    labelLine={false}
                  >
                    {taxStatus.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? GOLD : i === 1 ? NAVY : '#7C9A92'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

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
                <td colSpan={4} className="px-5 py-8">
                  <div className="mx-auto h-4 w-40 animate-pulse rounded bg-border/70" />
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <EmptyState message="No investors found. Upload your investor data under Data Import." />
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
