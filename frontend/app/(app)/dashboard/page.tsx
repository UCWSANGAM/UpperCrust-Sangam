'use client';
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Percent, Folder, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, PageHeader, StatCard } from '@/components/ui';

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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <p className="mb-4 text-[13px] font-medium text-ink">{title}</p>
      {children}
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/investors/stats')
      .then(({ data }) => setStats(data))
      .catch(() => setError('Could not load dashboard data'));
  }, []);

  return (
    <div className="p-8">
      <PageHeader title="Mission Control" subtitle="Investor book, portfolio intelligence at a glance" />

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
              <ChartCard title="Equity vs debt">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Equity', value: toCr(stats.equityAum) },
                        { name: 'Debt', value: toCr(stats.debtAum) },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      <Cell fill={GOLD} />
                      <Cell fill={NAVY} />
                    </Pie>
                    <Tooltip formatter={(v: number) => `₹${v} Cr`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Top investors by AUM">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.topInvestors.map((i) => ({ name: i.name, cr: toCr(i.aum) }))}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => `₹${v} Cr`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="cr" fill={GOLD} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="AUM by family group">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.familyGroups.map((g) => ({ name: g.name, cr: toCr(g.aum) }))} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                    <Tooltip formatter={(v: number) => `₹${v} Cr`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="cr" fill={NAVY} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}
