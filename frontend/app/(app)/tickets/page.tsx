'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, PageHeader, Badge, Avatar } from '@/components/ui';

const WORK_TYPES = [
  { value: 'CLIENT_ONBOARDING', label: 'Client onboarding' },
  { value: 'KYC_COMPLIANCE', label: 'KYC / Compliance' },
  { value: 'PORTFOLIO_REVIEW', label: 'Portfolio review' },
  { value: 'REDEMPTION_WITHDRAWAL', label: 'Redemption / Withdrawal' },
  { value: 'DOCUMENTATION', label: 'Documentation' },
  { value: 'OTHER', label: 'Other' },
];

const WORK_TYPE_LABEL: Record<string, string> = Object.fromEntries(WORK_TYPES.map((w) => [w.value, w.label]));

type Ticket = {
  id: string;
  workType: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  dueAt?: string;
  assignedTo: { name: string };
  createdBy: { name: string };
};

type UserOption = { id: string; name: string };

function formatDue(iso?: string) {
  if (!iso) return 'No deadline';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    workType: 'CLIENT_ONBOARDING',
    title: '',
    description: '',
    dueAt: '',
    assignedToId: '',
  });
  const [creating, setCreating] = useState(false);

  function load() {
    api.get('/tickets').then(({ data }) => setTickets(data)).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    api.get('/users').then(({ data }) => setUsers(data)).catch(() => {});
  }, []);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.assignedToId) return;
    setCreating(true);
    try {
      await api.post('/tickets', {
        workType: form.workType,
        title: form.title,
        description: form.description || undefined,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
        assignedToId: form.assignedToId,
      });
      setForm({ workType: 'CLIENT_ONBOARDING', title: '', description: '', dueAt: '', assignedToId: '' });
      load();
    } finally {
      setCreating(false);
    }
  }

  async function setStatus(id: string, status: string) {
    await api.patch(`/tickets/${id}`, { status });
    load();
  }

  const open = tickets.filter((t) => t.status !== 'DONE');
  const done = tickets.filter((t) => t.status === 'DONE');

  return (
    <div className="p-8">
      <PageHeader title="Tickets" subtitle={`${open.length} open, ${done.length} completed`} />

      <Card className="mb-8 max-w-2xl p-5">
        <form onSubmit={createTicket} className="grid grid-cols-2 gap-3">
          <select
            value={form.workType}
            onChange={(e) => setForm({ ...form, workType: e.target.value })}
            className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          >
            {WORK_TYPES.map((w) => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
          <input
            required
            placeholder="What's the work?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            placeholder="Details (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <select
            required
            value={form.assignedToId}
            onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Tag colleague...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={form.dueAt}
            onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={creating}
            className="col-span-2 rounded-lg bg-accent py-2 text-sm font-medium text-white hover:bg-accentDark transition-colors disabled:opacity-50"
          >
            {creating ? 'Raising...' : 'Raise ticket'}
          </button>
        </form>
      </Card>

      <div className="space-y-2">
        {loading && <p className="text-sm text-muted">Loading...</p>}
        {!loading && tickets.length === 0 && <p className="text-sm text-muted">No tickets yet.</p>}
        {tickets.map((t) => (
          <Card key={t.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone="gray">{WORK_TYPE_LABEL[t.workType]}</Badge>
                  <span className="text-[13px] font-medium text-ink">{t.title}</span>
                </div>
                <p className="mt-1 text-[12px] text-muted">
                  {formatDue(t.dueAt)} · Raised by {t.createdBy.name} · Assigned to {t.assignedTo.name}
                  {t.description && ` · ${t.description}`}
                </p>
              </div>
              <select
                value={t.status}
                onChange={(e) => setStatus(t.id, e.target.value)}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
