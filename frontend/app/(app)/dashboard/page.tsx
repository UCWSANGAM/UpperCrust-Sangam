'use client';
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Percent, Folder, Users, Cake } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, PageHeader, StatCard, Avatar } from '@/components/ui';

type Occasion = {
  investorId: string;
  name: string;
  type: 'birthday' | 'anniversary';
  daysUntil: number;
};

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

type Stats = {
  totalInvestors: number;
  totalFolios: number;
  totalAum: number;
  equityAum: number;
  debtAum: number;
  avgXirr: number;
  topInvestors: { name: string; aum: number }[];
  familyGroups: { name: string; aum: number }[];
};

const GOLD = '#B8935A';
const NAVY = '#14171B';

function toCr(value: number) {
  return Number((value / 10000000).toFixed(2));
}

function formatCr(value: number) {
  return `₹${toCr(value)} Cr`;
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
              <ChartCard title="Equity vs debt" icon={Wallet}>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Equity', value: toCr(stats.equityAum) },
                          { name: 'Debt', value: toCr(stats.debtAum) },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={62}
                        outerRadius={88}
                        paddingAngle={2}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        <Cell fill={GOLD} />
                        <Cell fill={NAVY} />
                      </Pie>
                      <Tooltip formatter={(v: number) => `₹${v} Cr`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend
                        verticalAlign="bottom"
                        height={28}
                        formatter={(value) => <span className="text-xs text-muted">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-center">
                    <p className="font-display text-lg text-ink">{formatCr(stats.equityAum + stats.debtAum)}</p>
                    <p className="text-[10px] uppercase text-muted">Total</p>
                  </div>
                </div>
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
                            style={{ width: `${pct}%`, backgroundColor: i === 0 ? NAVY : GOLD }}
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
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={stats.familyGroups.map((g) => ({
                      name: g.name.length > 16 ? g.name.slice(0, 16) + '…' : g.name,
                      fullName: g.name,
                      cr: toCr(g.aum),
                    }))}
                    layout="vertical"
                    margin={{ left: 8 }}
                  >
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip
                      formatter={(v: number) => `₹${v} Cr`}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Bar dataKey="cr" fill={NAVY} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
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
