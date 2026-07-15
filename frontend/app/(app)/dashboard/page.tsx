'use client';
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';

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

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="mb-4 font-display text-lg text-ink">{title}</p>
      {children}
    </div>
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
      <h1 className="font-display text-3xl text-ink">Mission Control</h1>
      <p className="mt-1 text-sm text-muted">Investor book, portfolio intelligence at a glance</p>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
      {!stats && !error && <p className="mt-6 text-sm text-muted">Loading...</p>}

      {stats && (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Total AUM" value={formatCr(stats.totalAum)} sub={`${stats.totalInvestors} investors`} />
            <StatCard label="Equity AUM" value={formatCr(stats.equityAum)} />
            <StatCard label="Debt AUM" value={formatCr(stats.debtAum)} />
            <StatCard label="Avg XIRR" value={`${stats.avgXirr.toFixed(2)}%`} />
            <StatCard label="Total Folios" value={String(stats.totalFolios)} />
            <StatCard label="Total Investors" value={String(stats.totalInvestors)} />
          </div>

          {stats.totalInvestors === 0 ? (
            <p className="mt-8 text-sm text-muted">
              No investor data yet — go to Data Import to upload your Investor List and Folio Report.
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
                    <Tooltip formatter={(v: number) => `₹${v} Cr`} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Top investors by AUM">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.topInvestors.map((i) => ({ name: i.name, cr: toCr(i.aum) }))}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => `₹${v} Cr`} />
                    <Bar dataKey="cr" fill={GOLD} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="AUM by family group">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.familyGroups.map((g) => ({ name: g.name, cr: toCr(g.aum) }))} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                    <Tooltip formatter={(v: number) => `₹${v} Cr`} />
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
