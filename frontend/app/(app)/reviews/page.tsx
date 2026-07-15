'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, PageHeader, Badge, Avatar, SectionTitle, EmptyState } from '@/components/ui';
import { CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const GOLD = '#B8935A';
const NAVY = '#14171B';

type Due = {
  year: number;
  quarter: number;
  pending: { id: string; name: string; aum: number | null }[];
  completed: number;
  total: number;
};

type ComplianceRow = {
  rmId: string;
  rmName: string;
  total: number;
  completed: number;
  pending: number;
};

type AgingRow = {
  investorId: string;
  name: string;
  aum: number;
  quartersOverdue: number;
};

function formatCr(value: number | null) {
  if (!value) return '—';
  return `₹${(value / 10000000).toFixed(2)} Cr`;
}

function progressTone(pct: number): 'green' | 'gold' | 'red' {
  if (pct >= 80) return 'green';
  if (pct >= 40) return 'gold';
  return 'red';
}

export default function ReviewsPage() {
  const [due, setDue] = useState<Due | null>(null);
  const [compliance, setCompliance] = useState<ComplianceRow[]>([]);
  const [aging, setAging] = useState<AgingRow[]>([]);

  useEffect(() => {
    api.get('/reviews/due').then(({ data }) => setDue(data));
    api.get('/reviews/compliance').then(({ data }) => setCompliance(data));
    api.get('/reviews/aging').then(({ data }) => setAging(data));
  }, []);

  if (!due) return <div className="p-8 text-sm text-muted">Loading...</div>;

  const progress = due.total === 0 ? 0 : Math.round((due.completed / due.total) * 100);
  const isTeamView = compliance.length > 1 || (compliance[0] && compliance[0].rmName !== 'You');

  return (
    <div className="p-8">
      <PageHeader title="Quarterly reviews" subtitle={`Q${due.quarter} ${due.year} — ${due.completed} of ${due.total} clients reviewed (${progress}%)`} />

      <div className="mb-8 flex items-center gap-6">
        <div className="w-40">
          <ResponsiveContainer width="100%" height={100}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Reviewed', value: due.completed },
                  { name: 'Pending', value: due.total - due.completed },
                ]}
                dataKey="value"
                innerRadius={32}
                outerRadius={48}
                paddingAngle={2}
              >
                <Cell fill={GOLD} />
                <Cell fill={NAVY} />
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1">
          <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-border">
            <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-[12px] text-muted">{due.completed} reviewed, {due.total - due.completed} pending</p>
        </div>
      </div>

      {isTeamView && (
        <>
          <SectionTitle>Team compliance</SectionTitle>
          <Card className="mb-8 overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-background/60 text-left text-[11px] font-medium uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">RM</th>
                  <th className="px-5 py-3 text-right">Reviewed</th>
                  <th className="px-5 py-3 text-right">Pending</th>
                  <th className="px-5 py-3 text-right">Completion</th>
                </tr>
              </thead>
              <tbody>
                {compliance.map((r) => {
                  const pct = r.total === 0 ? 0 : Math.round((r.completed / r.total) * 100);
                  return (
                    <tr key={r.rmId} className="border-b border-border last:border-0 hover:bg-background/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.rmName} />
                          <span className="font-medium text-ink">{r.rmName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-muted">{r.completed} / {r.total}</td>
                      <td className="px-5 py-3 text-right text-muted">{r.pending}</td>
                      <td className="px-5 py-3 text-right">
                        <Badge tone={progressTone(pct)}>{pct}%</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {aging.length > 0 && (
        <>
          <SectionTitle>Most overdue (aging)</SectionTitle>
          <Card className="mb-8 overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-background/60 text-left text-[11px] font-medium uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">Investor</th>
                  <th className="px-5 py-3 text-right">AUM</th>
                  <th className="px-5 py-3 text-right">Overdue</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {aging.slice(0, 10).map((a) => (
                  <tr key={a.investorId} className="border-b border-border last:border-0 hover:bg-background/50">
                    <td className="px-5 py-3 text-ink">{a.name}</td>
                    <td className="px-5 py-3 text-right font-display text-ink">{formatCr(a.aum)}</td>
                    <td className="px-5 py-3 text-right">
                      <Badge tone={a.quartersOverdue >= 3 ? 'red' : 'gold'}>
                        {a.quartersOverdue >= 99 ? 'Never reviewed' : `${a.quartersOverdue}Q overdue`}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/investors/${a.investorId}`} className="text-xs font-medium text-accentDark hover:underline">
                        Review now
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      <SectionTitle>Pending review ({due.pending.length})</SectionTitle>
      <Card className="overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-background/60 text-left text-[11px] font-medium uppercase tracking-wide text-muted">
              <th className="px-5 py-3">Investor</th>
              <th className="px-5 py-3 text-right">AUM</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {due.pending.length === 0 && (
              <tr>
                <td colSpan={3}>
                  <EmptyState message="All caught up for this quarter." icon={CheckCircle2} />
                </td>
              </tr>
            )}
            {due.pending.map((inv) => (
              <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-background/50">
                <td className="px-5 py-3 text-ink">{inv.name}</td>
                <td className="px-5 py-3 text-right font-display text-ink">{formatCr(inv.aum)}</td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/investors/${inv.id}`} className="text-xs font-medium text-accentDark hover:underline">
                    Review now
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
