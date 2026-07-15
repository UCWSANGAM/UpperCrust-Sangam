'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

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
      <h2 className="font-display text-xl text-ink">Notes & activity</h2>

      <form onSubmit={submitNote} className="mt-4 flex gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note about this investor..."
          className="flex-1 rounded border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentDark transition-colors disabled:opacity-50"
        >
          Add note
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {loading && <p className="text-sm text-muted">Loading...</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-muted">No notes or activity yet — add the first note above.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink">{item.actor}</span>
              <span className="text-xs text-muted">{timeAgo(item.createdAt)}</span>
            </div>
            <p className="mt-1 text-sm text-muted">
              {item.type === 'note' ? item.content : formatEventLabel(item.content)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatEventLabel(action: string) {
  const map: Record<string, string> = {
    NOTE_ADDED: 'Added a note',
    IMPORT_INVESTOR_LIST: 'Investor list imported',
    IMPORT_FOLIO_REPORT: 'Folio report imported',
  };
  return map[action] || action;
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
      <h2 className="font-display text-xl text-ink">
        Quarterly review — Q{currentQuarter} {currentYear}
      </h2>

      {alreadyDone ? (
        <p className="mt-3 text-sm text-green-700">Review completed for this quarter.</p>
      ) : (
        <form onSubmit={submit} className="mt-4 max-w-md rounded-lg border border-border bg-surface p-4">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={contactMade} onChange={(e) => setContactMade(e.target.checked)} />
            Contact made with client
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={riskProfileReviewed} onChange={(e) => setRiskProfileReviewed(e.target.checked)} />
            Risk profile reviewed
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={crossSellDiscussed} onChange={(e) => setCrossSellDiscussed(e.target.checked)} />
            Cross-sell opportunities discussed
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Review notes..."
            className="mt-3 w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            rows={3}
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-3 rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentDark transition-colors disabled:opacity-50"
          >
            Submit review
          </button>
        </form>
      )}

      {reviews.length > 0 && (
        <div className="mt-4 space-y-2">
          {reviews.map((r) => (
            <div key={r.id} className="rounded border border-border bg-surface p-3 text-xs text-muted">
              Q{r.quarter} {r.year} by {r.reviewer?.name} — {r.notes || 'No notes'}
            </div>
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
      <h2 className="font-display text-xl text-ink">Product holdings</h2>
      <p className="mt-1 text-sm text-muted">Click a status to cycle it — Opportunity → Holds → Not eligible</p>
      {loading ? (
        <p className="mt-3 text-sm text-muted">Loading...</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
          {rows.map((r) => (
            <button
              key={r.productId}
              onClick={() => cycleStatus(r.productId, r.status)}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5 text-left text-xs hover:border-accent"
            >
              <span className="text-ink">{r.productName}</span>
              <span
                className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  r.status === 'HOLDS'
                    ? 'bg-emerald-50 text-emerald-700'
                    : r.status === 'NOT_ELIGIBLE'
                    ? 'bg-gray-100 text-gray-500'
                    : 'bg-accent/10 text-accentDark'
                }`}
              >
                {STATUS_LABELS[r.status]}
              </span>
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

  if (error) return <div className="p-8 text-sm text-red-600">{error}</div>;
  if (!investor) return <div className="p-8 text-sm text-muted">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl text-ink">{investor.name}</h1>
      <p className="mt-1 text-sm text-muted">{investor.familyGroup || 'No family group'}</p>

      {opportunities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {opportunities.map((reason, i) => (
            <span key={i} className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-accentDark">
              {reason}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs uppercase text-muted">Total AUM</p>
          <p className="mt-1 font-display text-xl text-ink">{formatCr(investor.totalMfAum)}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs uppercase text-muted">Equity AUM</p>
          <p className="mt-1 font-display text-xl text-ink">{formatCr(investor.equityAum)}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs uppercase text-muted">Debt AUM</p>
          <p className="mt-1 font-display text-xl text-ink">{formatCr(investor.debtAum)}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs uppercase text-muted">XIRR</p>
          <p className="mt-1 font-display text-xl text-ink">
            {investor.xirrTotal ? `${investor.xirrTotal.toFixed(2)}%` : '—'}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 max-w-md">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs uppercase text-muted">PAN</p>
          <p className="mt-1 text-sm text-ink">{investor.pan || '—'}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs uppercase text-muted">Mobile</p>
          <p className="mt-1 text-sm text-ink">{investor.mobile || '—'}</p>
        </div>
      </div>

      <h2 className="mt-10 font-display text-xl text-ink">Folios ({investor.folios.length})</h2>
      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background/50 text-left text-xs uppercase text-muted">
              <th className="px-4 py-3">Folio No</th>
              <th className="px-4 py-3">AMC</th>
              <th className="px-4 py-3">Scheme</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {investor.folios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No folios linked yet — upload the Folio Report under Data Import.
                </td>
              </tr>
            )}
            {investor.folios.map((f) => (
              <tr key={f.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-ink">{f.folioNumber}</td>
                <td className="px-4 py-3 text-muted">{f.amc}</td>
                <td className="px-4 py-3 text-muted">{f.scheme}</td>
                <td className="px-4 py-3 text-muted">{f.status || '—'}</td>
                <td className="px-4 py-3 text-right font-display text-ink">
                  {f.currentValue ? `₹${f.currentValue.toLocaleString('en-IN')}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ActivityFeed investorId={investor.id} />
      <ProductMatrix investorId={investor.id} />
      <QuarterlyReviewBox investorId={investor.id} />
    </div>
  );
}
