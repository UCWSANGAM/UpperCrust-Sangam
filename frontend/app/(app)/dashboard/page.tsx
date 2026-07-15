'use client';
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Folder, Users, Cake, PieChart as PieIcon, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, PageHeader, StatCard, Avatar, Badge, ChartCard, EmptyState, Skeleton } from '@/components/ui';

type Stats = {
  totalInvestors: number;
  totalFolios: number;
  totalAum: number;
  equityAum: number;
  debtAum: number;
  cashAum: number;
  goldAum: number;
  pmsAum: number;
  avgXirr: number;
  topInvestors: { name: string; aum: number; xirr: number | null; familyGroup: string | null }[];
  familyGroups: { name: string; aum: number }[];
  xirrDistribution: { label: string; count: number }[];
  genderSplit: { name: string; count: number }[];
};

type Occasion = {
  investorId: string;
  name: string;
  type: 'birthday' | 'anniversary';
  daysUntil: number;
};

const PALETTE = ['#B8935A', '#14171B', '#7C9A92', '#C97B5E', '#8A6A3E'];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function occasionLabel(days: number) {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

function formatCr(value: number) {
  return `₹${(value / 10000000).toFixed(2)} Cr`;
}

function xirrTone(x: number | null): 'green' | 'red' | 'gray' {
  if (x === null) return 'gray';
  return x >= 0 ? 'green' : 'red';
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    setUserName(sessionStorage.getItem('userName') || 'there');
    api
      .get('/investors/stats')
      .then(({ data }) => setStats(data))
      .catch(() => setError('Could not load dashboard data'));
    api.get('/investors/occasions').then(({ data }) => setOccasions(data)).catch(() => {});
  }, []);

  return (
    <div className="p-8">
      <PageHeader title={`${greeting()}, ${userName.split(' ')[0]}`} subtitle="Here's how the desk is tracking today" />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!stats && !error && (
        <>
          <div className="mb-5 rounded-xl border border-border p-7">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-9 w-48" />
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-3 h-6 w-24" />
              </div>
            ))}
          </div>
        </>
      )}

      {stats && (
        <>
          <div className="mb-5 flex items-center justify-between rounded-xl border border-border p-7">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Total AUM</p>
              <p className="mt-1.5 font-display text-[38px] leading-none text-ink">{formatCr(stats.totalAum)}</p>
              <p className="mt-2 text-[12px] font-medium text-emerald-700">
                {stats.totalAum > 0 ? `${((stats.equityAum / stats.totalAum) * 100).toFixed(0)}% equity` : '—'} · {stats.totalInvestors} investors
              </p>
            </div>
            <div className="flex gap-8">
              <div className="text-right">
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted">Avg XIRR</p>
                <p className="mt-1 text-[20px] font-semibold text-ink">{stats.avgXirr.toFixed(2)}%</p>
              </div>
              <div className="text-right">
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted">Avg AUM / Investor</p>
                <p className="mt-1 text-[20px] font-semibold text-ink">
                  {stats.totalInvestors > 0 ? formatCr(stats.totalAum / stats.totalInvestors) : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Equity AUM" value={formatCr(stats.equityAum)} icon={TrendingUp} />
            <StatCard label="Debt AUM" value={formatCr(stats.debtAum)} icon={TrendingDown} />
            <StatCard label="Total Investors" value={String(stats.totalInvestors)} icon={Users} />
            <StatCard label="Total Folios" value={String(stats.totalFolios)} icon={Folder} />
          </div>

          {stats.totalInvestors === 0 ? (
            <div className="mt-6">
              <EmptyState message="No investor data yet — go to Data Import to upload your investor data file." icon={Upload} />
            </div>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <ChartCard title="AUM composition" icon={PieIcon}>
                {(() => {
                  const segments = [
                    { name: 'Equity', value: stats.equityAum },
                    { name: 'Debt', value: stats.debtAum },
                    { name: 'Cash', value: stats.cashAum },
                    { name: 'Gold', value: stats.goldAum },
                    { name: 'PMS', value: stats.pmsAum },
                  ].filter((s) => s.value > 0);
                  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
                  return (
                    <div className="relative">
                      <ResponsiveContainer width="100%" height={230}>
                        <PieChart>
                          <Pie
                            data={segments}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={58}
                            outerRadius={84}
                            paddingAngle={2}
                            label={({ name, value }) =>
                              value / total >= 0.05 ? `${name} ${((value / total) * 100).toFixed(0)}%` : ''
                            }
                            labelLine={false}
                          >
                            {segments.map((_, i) => (
                              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => formatCr(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          <Legend
                            verticalAlign="bottom"
                            height={28}
                            formatter={(value) => <span className="text-xs text-muted">{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-center">
                        <p className="font-display text-lg text-ink">{formatCr(total)}</p>
                        <p className="text-[10px] uppercase text-muted">Total</p>
                      </div>
                    </div>
                  );
                })()}
              </ChartCard>

              <ChartCard title="Top investors by AUM" icon={Users}>
                <div className="space-y-3">
                  {stats.topInvestors.slice(0, 6).map((inv, i) => {
                    const max = stats.topInvestors[0]?.aum || 1;
                    const pct = Math.max(6, (inv.aum / max) * 100);
                    return (
                      <div key={inv.name} className="flex items-center gap-3">
                        <span className="w-32 shrink-0 truncate text-[12px] text-ink">{inv.name}</span>
                        <div className="relative h-6 flex-1 overflow-hidden rounded bg-background">
                          <div
                            className="h-full rounded transition-all"
                            style={{ width: `${pct}%`, backgroundColor: i === 0 ? '#14171B' : '#B8935A' }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-medium text-ink">
                            {formatCr(inv.aum)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>

              <ChartCard title="AUM by family group" icon={Folder}>
                <div className="space-y-2.5">
                  {stats.familyGroups.slice(0, 8).map((g, i) => {
                    const max = stats.familyGroups[0]?.aum || 1;
                    const pct = Math.max(4, (g.aum / max) * 100);
                    const short = g.name.length > 22 ? g.name.slice(0, 22) + '…' : g.name;
                    const barColor = i === 0 ? '#14171B' : i < 3 ? '#8A6A3E' : '#B8935A';
                    return (
                      <div key={g.name} className="group flex items-center gap-3" title={g.name}>
                        <span className="w-36 shrink-0 truncate text-[12px] text-ink">{short}</span>
                        <div className="h-4 flex-1 overflow-hidden rounded bg-background">
                          <div
                            className="h-full rounded transition-all group-hover:opacity-80"
                            style={{ width: `${pct}%`, backgroundColor: barColor }}
                          />
                        </div>
                        <span className="w-16 shrink-0 text-right text-[11px] font-medium text-ink">{formatCr(g.aum)}</span>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>

              <ChartCard title="Top holdings" icon={Wallet}>
                <div className="space-y-0">
                  {stats.topInvestors.slice(0, 6).map((inv, i) => {
                    const totalTop = stats.topInvestors.slice(0, 6).reduce((s, x) => s + x.aum, 0) || 1;
                    const weight = (inv.aum / totalTop) * 100;
                    return (
                      <div key={inv.name} className={`flex items-center gap-3 py-2 ${i !== 0 ? 'border-t border-border' : ''}`}>
                        <Avatar name={inv.name} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-medium text-ink">{inv.name}</p>
                          {inv.familyGroup && <p className="truncate text-[10px] text-muted">{inv.familyGroup}</p>}
                        </div>
                        <span className="w-16 shrink-0 text-right font-display text-[12px] text-ink">{formatCr(inv.aum)}</span>
                        {inv.xirr !== null && (
                          <Badge tone={xirrTone(inv.xirr)}>{inv.xirr.toFixed(1)}%</Badge>
                        )}
                        <span className="w-10 shrink-0 text-right text-[11px] text-muted">{weight.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>

              <ChartCard title="XIRR distribution" icon={TrendingUp}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.xirrDistribution}>
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="count" fill={GOLD} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {stats.genderSplit.length > 0 && (
                <ChartCard title="Investors by gender" icon={Users}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={stats.genderSplit.map((g) => ({ name: g.name, value: g.count }))}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={2}
                        label={({ name, value }) => `${name} ${value}`}
                        labelLine={false}
                      >
                        {stats.genderSplit.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>
          )}

          {occasions.length > 0 && (
            <Card className="mt-4 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Cake size={14} className="text-accentDark" />
                <p className="text-[13px] font-medium text-ink">Upcoming birthdays & anniversaries</p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {occasions.slice(0, 9).map((o) => (
                  <div key={`${o.investorId}-${o.type}`} className="flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-2">
                    <Avatar name={o.name} />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium text-ink">{o.name}</p>
                      <p className="text-[11px] text-muted capitalize">{o.type} · {occasionLabel(o.daysUntil)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
