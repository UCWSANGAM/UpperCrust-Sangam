'use client';
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Percent, Folder, Users, Cake, PieChart as PieIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, PageHeader, StatCard, Avatar, Badge } from '@/components/ui';

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

function ChartCard({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2.5">
        {Icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/12">
            <Icon size={14} className="text-accentDark" strokeWidth={2} />
          </div>
        )}
        <p className="text-[13px] font-medium text-ink">{title}</p>
      </div>
      {children}
    </Card>
  );
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
      {!stats && !error && <p className="text-sm text-muted">Loading...</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total AUM" value={formatCr(stats.totalAum)} sub={`${stats.totalInvestors} investors`} icon={Wallet} />
            <StatCard label="Equity AUM" value={formatCr(stats.equityAum)} icon={TrendingUp} />
            <StatCard label="Debt AUM" value={formatCr(stats.debtAum)} icon={TrendingDown} />
            <StatCard label="Avg XIRR" value={`${stats.avgXirr.toFixed(2)}%`} icon={Percent} />
            <StatCard label="Total Folios" value={String(stats.totalFolios)} icon={Folder} />
            <StatCard label="Total Investors" value={String(stats.totalInvestors)} icon={Users} />
          </div>

          {stats.totalInvestors === 0 ? (
            <p className="mt-8 text-sm text-muted">
              No investor data yet — go to Data Import to upload your investor data file.
            </p>
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
                            label={({ name, value }) => `${name} ${((value / total) * 100).toFixed(0)}%`}
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
                  {stats.familyGroups.slice(0, 8).map((g) => {
                    const max = stats.familyGroups[0]?.aum || 1;
                    const pct = Math.max(4, (g.aum / max) * 100);
                    const short = g.name.length > 22 ? g.name.slice(0, 22) + '…' : g.name;
                    return (
                      <div key={g.name} className="flex items-center gap-3" title={g.name}>
                        <span className="w-36 shrink-0 truncate text-[12px] text-ink">{short}</span>
                        <div className="h-4 flex-1 overflow-hidden rounded bg-background">
                          <div className="h-full rounded bg-[#14171B] transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-16 shrink-0 text-right text-[11px] text-muted">{formatCr(g.aum)}</span>
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
            </div>
          )}

          {occasions.length > 0 && (
            <Card className="mt-4 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Cake size={15} className="text-accentDark" />
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
