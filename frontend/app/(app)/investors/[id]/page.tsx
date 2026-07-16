'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, PageHeader, SectionTitle, Badge, Avatar, EmptyState, StatCard } from '@/components/ui';
import { Wallet, TrendingUp, TrendingDown, Percent, MessageSquare, Package } from 'lucide-react';

type Folio = {
  id: string;
  folioNumber: string;
  amc: string;
  scheme: string;
  currentValue?: number;
  status?: string;
};

type InvestorDetail = {
  id: string;
  name: string;
  familyGroup?: string;
  pan?: string;
  mobile?: string;
  totalMfAum?: number;
  equityAum?: number;
  debtAum?: number;
  xirrTotal?: number;
  folios: Folio[];
};

type ActivityItem = {
  type: 'note' | 'event';
  id: string;
  content: string;
  actor: string;
  createdAt: string;
};

function formatCr(value?: number) {
  if (!value) return '—';
  return `₹${(value / 10000000).toFixed(2)} Cr`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatEventLabel(action: string) {
  const map: Record<string, string> = {
    NOTE_ADDED: 'Added a note',
    IMPORT_INVESTOR_LIST: 'Investor list imported',
    IMPORT_FOLIO_REPORT: 'Folio report imported',
  };
  return map[action] || action;
}

function ActivityFeed({ investorId }: { investorId: string }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  function load() {
    api
      .get(`/investors/${investorId}/activity`)
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investorId]);

  async function submitNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    try {
      await api.post(`/investors/${investorId}/notes`, { content: note });
      setNote('');
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-10">
      <SectionTitle>Notes & activity</SectionTitle>

      <form onSubmit={submitNote} className="flex gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note about this investor..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-accentDark transition-colors disabled:opacity-50"
        >
          Add note
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {loading && <p className="text-[13px] text-muted">Loading...</p>}
        {!loading && items.length === 0 && <EmptyState message="No notes or activity yet — add the first note above." icon={MessageSquare} />}
        {items.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-ink">{item.actor}</span>
              <span className="text-[11px] text-muted">{timeAgo(item.createdAt)}</span>
            </div>
            <p className="mt-1 text-[13px] text-muted">
              {item.type === 'note' ? item.content : formatEventLabel(item.content)}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function QuarterlyReviewBox({ investorId }: { investorId: string }) {
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const currentYear = now.getFullYear();

  const [reviews, setReviews] = useState<any[]>([]);
  const [contactMade, setContactMade] = useState(false);
  const [riskProfileReviewed, setRiskProfileReviewed] = useState(false);
  const [crossSellDiscussed, setCrossSellDiscussed] = useState(false);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    api.get(`/reviews/investor/${investorId}`).then(({ data }) => setReviews(data));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investorId]);

  const alreadyDone = reviews.some((r) => r.year === currentYear && r.quarter === currentQuarter);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/reviews/investor/${investorId}`, {
        year: currentYear,
        quarter: currentQuarter,
        contactMade,
        riskProfileReviewed,
        crossSellDiscussed,
        notes: notes || undefined,
      });
      setNotes('');
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-10">
      <SectionTitle>Quarterly review — Q{currentQuarter} {currentYear}</SectionTitle>

      {alreadyDone ? (
        <Badge tone="green">Review completed for this quarter</Badge>
      ) : (
        <Card className="max-w-md p-5">
          <form onSubmit={submit}>
            <label className="flex items-center gap-2 text-[13px] text-ink">
              <input type="checkbox" checked={contactMade} onChange={(e) => setContactMade(e.target.checked)} />
              Contact made with client
            </label>
            <label className="mt-2 flex items-center gap-2 text-[13px] text-ink">
              <input type="checkbox" checked={riskProfileReviewed} onChange={(e) => setRiskProfileReviewed(e.target.checked)} />
              Risk profile reviewed
            </label>
            <label className="mt-2 flex items-center gap-2 text-[13px] text-ink">
              <input type="checkbox" checked={crossSellDiscussed} onChange={(e) => setCrossSellDiscussed(e.target.checked)} />
              Cross-sell opportunities discussed
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Review notes..."
              className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-accent"
              rows={3}
            />
            <button
              type="submit"
              disabled={busy}
              className="mt-3 rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-accentDark transition-colors disabled:opacity-50"
            >
              Submit review
            </button>
          </form>
        </Card>
      )}

      {reviews.length > 0 && (
        <div className="mt-4 space-y-2">
          {reviews.map((r) => (
            <Card key={r.id} className="p-3 text-[12px] text-muted">
              Q{r.quarter} {r.year} by {r.reviewer?.name} — {r.notes || 'No notes'}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  HOLDS: 'Holds',
  NOT_HOLDING: 'Opportunity',
  NOT_ELIGIBLE: 'Not eligible',
};

const STATUS_TONE: Record<string, 'green' | 'gold' | 'gray'> = {
  HOLDS: 'green',
  NOT_HOLDING: 'gold',
  NOT_ELIGIBLE: 'gray',
};

function ProductMatrix({ investorId }: { investorId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api.get(`/products/investor/${investorId}`).then(({ data }) => setRows(data)).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investorId]);

  async function cycleStatus(productId: string, current: string) {
    const order = ['NOT_HOLDING', 'HOLDS', 'NOT_ELIGIBLE'];
    const next = order[(order.indexOf(current) + 1) % order.length];
    await api.put(`/products/investor/${investorId}/product/${productId}`, { status: next });
    load();
  }

  return (
    <div className="mt-10">
      <SectionTitle>Product holdings</SectionTitle>
      <p className="mb-4 text-[13px] text-muted">Click a status to cycle it — Opportunity → Holds → Not eligible</p>
      {loading ? (
        <p className="text-[13px] text-muted">Loading...</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {rows.map((r) => (
            <button
              key={r.productId}
              onClick={() => cycleStatus(r.productId, r.status)}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5 text-left hover:border-accent"
            >
              <span className="text-[13px] text-ink">{r.productName}</span>
              <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABELS[r.status]}</Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InvestorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [investor, setInvestor] = useState<InvestorDetail | null>(null);
  const [error, setError] = useState('');
  const [opportunities, setOpportunities] = useState<string[]>([]);

  useEffect(() => {
    api
      .get(`/investors/${id}`)
      .then(({ data }) => setInvestor(data))
      .catch(() => setError('Could not load this investor'));

    api
      .get('/investors/opportunities')
      .then(({ data }) => {
        const match = data.find((o: any) => o.investorId === id);
        setOpportunities(match?.reasons || []);
      })
      .catch(() => {});
  }, [id]);

  if (error) return <div className="p-8 text-[13px] text-red-600">{error}</div>;
  if (!investor) return <div className="p-8 text-[13px] text-muted">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-2 flex items-center gap-3">
        <Avatar name={investor.name} />
        <PageHeader title={investor.name} subtitle={investor.familyGroup || 'No family group'} />
      </div>

      {opportunities.length > 0 && (
        <div className="-mt-4 mb-6 flex flex-wrap gap-2">
          {opportunities.map((reason, i) => (
            <Badge key={i} tone="gold">{reason}</Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total AUM" value={formatCr(investor.totalMfAum)} icon={Wallet} />
        <StatCard label="Equity AUM" value={formatCr(investor.equityAum)} icon={TrendingUp} />
        <StatCard label="Debt AUM" value={formatCr(investor.debtAum)} icon={TrendingDown} />
        <StatCard label="XIRR" value={investor.xirrTotal ? `${investor.xirrTotal.toFixed(2)}%` : '—'} icon={Percent} />
      </div>

      <div className="mt-4 grid max-w-md grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">PAN</p>
          <p className="mt-1 text-[13px] text-ink">{investor.pan || '—'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Mobile</p>
          <p className="mt-1 text-[13px] text-ink">{investor.mobile || '—'}</p>
        </Card>
      </div>

      <div className="mt-10">
        <SectionTitle>Folios ({investor.folios.length})</SectionTitle>
        <Card className="overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-background/60 text-left text-[11px] font-medium uppercase tracking-wide text-muted">
                <th className="px-5 py-3">Folio No</th>
                <th className="px-5 py-3">AMC</th>
                <th className="px-5 py-3">Scheme</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {investor.folios.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message="No folios linked yet — upload the Folio Report under Data Import." icon={Package} />
                  </td>
                </tr>
              )}
              {investor.folios.map((f) => (
                <tr key={f.id} className="border-b border-border last:border-0 hover:bg-background/50">
                  <td className="px-5 py-3 text-ink">{f.folioNumber}</td>
                  <td className="px-5 py-3 text-muted">{f.amc}</td>
                  <td className="px-5 py-3 text-muted">{f.scheme}</td>
                  <td className="px-5 py-3 text-muted">{f.status || '—'}</td>
                  <td className="px-5 py-3 text-right font-display text-ink">
                    {f.currentValue ? `₹${f.currentValue.toLocaleString('en-IN')}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <ActivityFeed investorId={investor.id} />
      <ProductMatrix investorId={investor.id} />
      <QuarterlyReviewBox investorId={investor.id} />
    </div>
  );
}
