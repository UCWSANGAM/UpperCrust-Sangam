'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, PageHeader, Badge, Avatar, StatCard, ChartCard, EmptyState } from '@/components/ui';
import { TrendingUp, Users, Wallet, Repeat } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Legend, Tooltip, ResponsiveContainer } from 'recharts';

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
  sipGrossSalesFY: number;
  sipNetSalesFY: number;
  lumpsumGrossSalesFY: number;
  nfoGrossSalesFY: number;
  swpAmount: number;
  topUpSipAmount: number;
  taxPlanSalesFY: number;
  pmsSalesFY: number;
  pmsSalesCY: number;
  fdBondSalesFY: number;
};

const GOLD = '#B8935A';
const NAVY = '#14171B';

function formatCr(value: number) {
  return `₹${(value / 10000000).toFixed(2)} Cr`;
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
      sipGrossSalesFY: acc.sipGrossSalesFY + r.sipGrossSalesFY,
      lumpsumGrossSalesFY: acc.lumpsumGrossSalesFY + r.lumpsumGrossSalesFY,
      nfoGrossSalesFY: acc.nfoGrossSalesFY + r.nfoGrossSalesFY,
    }),
    { netSalesFY: 0, netSalesCY: 0, totalAum: 0, sipGrossSalesFY: 0, lumpsumGrossSalesFY: 0, nfoGrossSalesFY: 0 },
  );

  return (
    <div className="p-8">
      <PageHeader title="Sales by RM" subtitle={`${rows.length} relationship managers`} />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 max-w-3xl">
        <StatCard label="Team AUM" value={formatCr(totals.totalAum)} icon={Wallet} />
        <StatCard label="Net Sales FY" value={formatCr(totals.netSalesFY)} icon={TrendingUp} />
        <StatCard label="Net Sales CY" value={formatCr(totals.netSalesCY)} icon={Users} />
        <StatCard label="NFO Sales FY" value={formatCr(totals.nfoGrossSalesFY)} icon={Repeat} />
      </div>

      {rows.length > 0 && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <ChartCard title="SIP vs lumpsum (gross sales FY)" icon={Repeat}>
            {totals.sipGrossSalesFY === 0 ? (
              <div className="flex h-[180px] flex-col items-center justify-center text-center">
                <p className="text-[13px] text-muted">No SIP sales recorded yet for this period.</p>
                <p className="mt-1 text-[12px] text-ink">All ₹{(totals.lumpsumGrossSalesFY / 10000000).toFixed(2)} Cr gross sales was lumpsum.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'SIP', value: Number((totals.sipGrossSalesFY / 10000000).toFixed(2)) },
                      { name: 'Lumpsum', value: Number((totals.lumpsumGrossSalesFY / 10000000).toFixed(2)) },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={2}
                    label={({ name, value }) => `${name} ₹${value}Cr`}
                    labelLine={false}
                  >
                    <Cell fill={GOLD} />
                    <Cell fill={NAVY} />
                  </Pie>
                  <Tooltip formatter={(v: number) => `₹${v} Cr`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Net sales FY by RM" icon={TrendingUp}>
            <div className="space-y-3">
              {[...rows]
                .sort((a, b) => b.netSalesFY - a.netSalesFY)
                .slice(0, 6)
                .map((r, i) => {
                  const max = Math.max(...rows.map((x) => x.netSalesFY), 1);
                  const pct = Math.max(6, (r.netSalesFY / max) * 100);
                  return (
                    <div key={r.rmId} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 truncate text-[12px] text-ink">{r.rmName}</span>
                      <div className="relative h-6 flex-1 overflow-hidden rounded bg-background">
                        <div
                          className="h-full rounded transition-all"
                          style={{ width: `${pct}%`, backgroundColor: i === 0 ? NAVY : GOLD }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-medium text-ink">
                          {formatCr(r.netSalesFY)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </ChartCard>

          <ChartCard title="Gross sales vs redemptions by RM (FY)" icon={TrendingUp}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={rows.map((r) => ({ name: r.rmName.split(' ')[0], Sales: Number((r.grossSalesFY / 10000000).toFixed(2)), Redemptions: Number((r.redemptionsFY / 10000000).toFixed(2)) }))}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => `₹${v} Cr`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Sales" fill={GOLD} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Redemptions" fill="#E24B4A" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {rows.some((r) => r.nfoGrossSalesFY > 0) && (
            <ChartCard title="NFO participation by RM (FY)" icon={Repeat}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={rows.filter((r) => r.nfoGrossSalesFY > 0).map((r) => ({ name: r.rmName.split(' ')[0], cr: Number((r.nfoGrossSalesFY / 10000000).toFixed(2)) }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => `₹${v} Cr`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="cr" fill={NAVY} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[1400px] text-[13px]">
          <thead>
            <tr className="border-b border-border bg-background/60 text-left text-[11px] font-medium uppercase tracking-wide text-muted">
              <th className="px-5 py-3">RM</th>
              <th className="px-5 py-3 text-right">Clients</th>
              <th className="px-5 py-3 text-right">AUM</th>
              <th className="px-5 py-3 text-right">SIP Sales FY</th>
              <th className="px-5 py-3 text-right">Lumpsum FY</th>
              <th className="px-5 py-3 text-right">NFO FY</th>
              <th className="px-5 py-3 text-right">Top-up SIP</th>
              <th className="px-5 py-3 text-right">SWP Amount</th>
              <th className="px-5 py-3 text-right">Tax-plan Sales FY</th>
              <th className="px-5 py-3 text-right">PMS Sales FY</th>
              <th className="px-5 py-3 text-right">FD/Bond Sales FY</th>
              <th className="px-5 py-3 text-right">Redemptions FY</th>
              <th className="px-5 py-3 text-right">Net Sales CY</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={13} className="px-5 py-8">
                  <div className="mx-auto h-4 w-40 animate-pulse rounded bg-border/70" />
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={13}>
                  <EmptyState message="No sales data yet — upload the investor data file under Data Import." icon={Wallet} />
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
                <td className="px-5 py-3 text-right text-ink">{formatCr(r.sipGrossSalesFY)}</td>
                <td className="px-5 py-3 text-right text-muted">{formatCr(r.lumpsumGrossSalesFY)}</td>
                <td className="px-5 py-3 text-right">
                  {r.nfoGrossSalesFY > 0 ? <Badge tone="blue">{formatCr(r.nfoGrossSalesFY)}</Badge> : <span className="text-muted">—</span>}
                </td>
                <td className="px-5 py-3 text-right text-muted">{r.topUpSipAmount > 0 ? formatCr(r.topUpSipAmount) : '—'}</td>
                <td className="px-5 py-3 text-right text-muted">{r.swpAmount > 0 ? formatCr(r.swpAmount) : '—'}</td>
                <td className="px-5 py-3 text-right text-muted">{r.taxPlanSalesFY > 0 ? formatCr(r.taxPlanSalesFY) : '—'}</td>
                <td className="px-5 py-3 text-right text-muted">{r.pmsSalesFY > 0 ? formatCr(r.pmsSalesFY) : '—'}</td>
                <td className="px-5 py-3 text-right text-muted">{r.fdBondSalesFY > 0 ? formatCr(r.fdBondSalesFY) : '—'}</td>
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
