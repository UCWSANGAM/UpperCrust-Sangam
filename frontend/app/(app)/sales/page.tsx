'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, PageHeader, Badge, Avatar, StatCard } from '@/components/ui';
import { TrendingUp, Users, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type RmSales = {
  rmId: string;
  rmName: string;
  investorCount: number;
  totalAum: number;
  netSalesFY: number;
  grossSalesFY: number;
  redemptionsFY: number;
  netSalesCY: number;
  grossSalesCY: number;
  redemptionsCY: number;
};

const GOLD = '#B8935A';

function formatCr(value: number) {
  return `₹${(value / 10000000).toFixed(2)} Cr`;
}
function toCr(value: number) {
  return Number((value / 10000000).toFixed(2));
}

export default function SalesPage() {
  const [rows, setRows] = useState<RmSales[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/investors/sales-by-rm')
      .then(({ data }) => setRows(data))
      .finally(() => setLoading(false));
  }, []);

  const totals = rows.reduce(
    (acc, r) => ({
      netSalesFY: acc.netSalesFY + r.netSalesFY,
      netSalesCY: acc.netSalesCY + r.netSalesCY,
      totalAum: acc.totalAum + r.totalAum,
    }),
    { netSalesFY: 0, netSalesCY: 0, totalAum: 0 },
  );

  const maxNetSales = Math.max(...rows.map((r) => r.netSalesFY), 1);

  return (
    <div className="p-8">
      <PageHeader title="Sales by RM" subtitle={`${rows.length} relationship managers`} />

      <div className="mb-6 grid grid-cols-3 gap-4 max-w-2xl">
        <StatCard label="Team AUM" value={formatCr(totals.totalAum)} icon={Wallet} />
        <StatCard label="Net Sales FY" value={formatCr(totals.netSalesFY)} icon={TrendingUp} />
        <StatCard label="Net Sales CY" value={formatCr(totals.netSalesCY)} icon={Users} />
      </div>

      {rows.length > 0 && (
        <Card className="mb-6 p-5">
          <p className="mb-4 text-[13px] font-medium text-ink">Net sales FY by RM</p>
          <div className="space-y-3">
            {[...rows]
              .sort((a, b) => b.netSalesFY - a.netSalesFY)
              .slice(0, 8)
              .map((r, i) => {
                const max = Math.max(...rows.map((x) => x.netSalesFY), 1);
                const pct = Math.max(6, (r.netSalesFY / max) * 100);
                return (
                  <div key={r.rmId} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 truncate text-[12px] text-ink">{r.rmName}</span>
                    <div className="relative h-6 flex-1 overflow-hidden rounded bg-background">
                      <div
                        className="h-full rounded transition-all"
                        style={{ width: `${pct}%`, backgroundColor: i === 0 ? '#14171B' : '#B8935A' }}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-medium text-ink">
                        {formatCr(r.netSalesFY)}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-background/60 text-left text-[11px] font-medium uppercase tracking-wide text-muted">
              <th className="px-5 py-3">RM</th>
              <th className="px-5 py-3 text-right">Clients</th>
              <th className="px-5 py-3 text-right">AUM</th>
              <th className="px-5 py-3">Net Sales FY</th>
              <th className="px-5 py-3 text-right">Gross Sales FY</th>
              <th className="px-5 py-3 text-right">Redemptions FY</th>
              <th className="px-5 py-3 text-right">Net Sales CY</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted">Loading...</td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted">
                  No sales data yet — upload the investor data file under Data Import.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.rmId} className="border-b border-border last:border-0 hover:bg-background/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.rmName} />
                    <span className="font-medium text-ink">{r.rmName}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right text-muted">{r.investorCount}</td>
                <td className="px-5 py-3 text-right font-display text-ink">{formatCr(r.totalAum)}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-ink">{formatCr(r.netSalesFY)}</span>
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${Math.max(4, (r.netSalesFY / maxNetSales) * 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-right text-muted">{formatCr(r.grossSalesFY)}</td>
                <td className="px-5 py-3 text-right">
                  <Badge tone="red">{formatCr(r.redemptionsFY)}</Badge>
                </td>
                <td className="px-5 py-3 text-right text-muted">{formatCr(r.netSalesCY)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
