'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, PageHeader, Badge, StatCard, ChartCard } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, Sparkles } from 'lucide-react';

type Board = {
  productId: string;
  productName: string;
  category: string | null;
  gapCount: number;
  topGaps: { investorId: string; name: string; aum: number }[];
};

type Conversions = {
  total: number;
  byProduct: { name: string; count: number }[];
  recent: { investorName: string; productName: string; by: string; date: string }[];
};

const GOLD = '#B8935A';

function formatCr(value: number) {
  if (!value) return '—';
  return `₹${(value / 10000000).toFixed(2)} Cr`;
}

export default function CrossSellPage() {
  const [board, setBoard] = useState<Board[]>([]);
  const [conversions, setConversions] = useState<Conversions | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.get('/products/cross-sell-board').then(({ data }) => setBoard(data));
    api.get('/products/conversions').then(({ data }) => setConversions(data));
  }, []);

  return (
    <div className="p-8">
      <PageHeader title="Cross-sell opportunities" subtitle="Investors not currently holding each product, ranked by AUM" />

      {conversions && (
        <div className="mb-6 grid grid-cols-2 gap-4 max-w-md">
          <StatCard label="Conversions this month" value={String(conversions.total)} icon={CheckCircle2} />
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="mb-2 text-[11px] font-medium uppercase text-muted">By product</p>
            <div className="space-y-1">
              {conversions.byProduct.slice(0, 3).map((p) => (
                <div key={p.name} className="flex justify-between text-[12px]">
                  <span className="truncate text-ink">{p.name}</span>
                  <span className="text-muted">{p.count}</span>
                </div>
              ))}
              {conversions.byProduct.length === 0 && <p className="text-[12px] text-muted">None yet this month</p>}
            </div>
          </div>
        </div>
      )}

      {board.length > 0 && (
        <div className="mb-6">
          <ChartCard title="Opportunity gaps by product" icon={Sparkles}>
            <ResponsiveContainer width="100%" height={Math.max(160, board.length * 32)}>
              <BarChart data={board.map((p) => ({ name: p.productName, gaps: p.gapCount }))} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={200} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="gaps" fill={GOLD} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      <div className="space-y-3">
        {board.map((p) => (
          <Card key={p.productId} className="overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === p.productId ? null : p.productId)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium text-ink">{p.productName}</span>
                {p.category && <Badge tone="gray">{p.category}</Badge>}
              </div>
              <Badge tone={p.gapCount > 0 ? 'gold' : 'green'}>{p.gapCount} gaps</Badge>
            </button>
            {expanded === p.productId && (
              <div className="border-t border-border">
                {p.topGaps.length === 0 && (
                  <p className="px-5 py-4 text-[13px] text-muted">No gaps — every investor holds this product.</p>
                )}
                {p.topGaps.map((g) => (
                  <Link
                    key={g.investorId}
                    href={`/investors/${g.investorId}`}
                    className="flex items-center justify-between border-b border-border px-5 py-2.5 text-[13px] last:border-0 hover:bg-background/50"
                  >
                    <span className="text-ink">{g.name}</span>
                    <span className="font-display text-muted">{formatCr(g.aum)}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
