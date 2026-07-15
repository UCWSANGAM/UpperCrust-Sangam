'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, PageHeader, Badge, Avatar, EmptyState, ChartCard } from '@/components/ui';
import { MessageCircle, ChevronDown, ChevronUp, Ticket as TicketIcon, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const WORK_TYPES = [
  { value: 'CLIENT_ONBOARDING', label: 'Client onboarding' },
  { value: 'KYC_COMPLIANCE', label: 'KYC / Compliance' },
  { value: 'PORTFOLIO_REVIEW', label: 'Portfolio review' },
  { value: 'REDEMPTION_WITHDRAWAL', label: 'Redemption / Withdrawal' },
  { value: 'DOCUMENTATION', label: 'Documentation' },
  { value: 'OTHER', label: 'Other' },
];
const WORK_TYPE_LABEL: Record<string, string> = Object.fromEntries(WORK_TYPES.map((w) => [w.value, w.label]));

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const PRIORITY_TONE: Record<string, 'gray' | 'blue' | 'gold' | 'red'> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'gold',
  URGENT: 'red',
};

type Ticket = {
  id: string;
  workType: string;
  priority: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  dueAt?: string;
  assignedTo: { name: string };
  createdBy: { name: string };
};

type Comment = { id: string; content: string; createdAt: string; author: { name: string } };
type UserOption = { id: string; name: string };

function formatDue(iso?: string) {
  if (!iso) return 'No deadline';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function CommentThread({ ticketId }: { ticketId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    api.get(`/tickets/${ticketId}/comments`).then(({ data }) => setComments(data));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api.post(`/tickets/${ticketId}/comments`, { content: text });
      setText('');
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-border bg-background/40 p-4">
      <div className="space-y-2">
        {comments.length === 0 && <p className="text-[12px] text-muted">No discussion yet.</p>}
        {comments.map((c) => (
          <div key={c.id} className="flex items-start gap-2">
            <Avatar name={c.author.name} />
            <div>
              <p className="text-[12px] font-medium text-ink">{c.author.name}</p>
              <p className="text-[12px] text-muted">{c.content}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Reply..."
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accentDark transition-colors disabled:opacity-50"
        >
          Reply
        </button>
      </form>
    </div>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    workType: 'CLIENT_ONBOARDING',
    priority: 'MEDIUM',
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
        priority: form.priority,
        title: form.title,
        description: form.description || undefined,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
        assignedToId: form.assignedToId,
      });
      setForm({ workType: 'CLIENT_ONBOARDING', priority: 'MEDIUM', title: '', description: '', dueAt: '', assignedToId: '' });
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
            className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-accent"
          >
            {WORK_TYPES.map((w) => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-accent"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()} priority</option>
            ))}
          </select>
          <input
            required
            placeholder="What's the work?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-accent"
          />
          <input
            placeholder="Details (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-accent"
          />
          <select
            required
            value={form.assignedToId}
            onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
            className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-accent"
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
            className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={creating}
            className="col-span-2 rounded-lg bg-accent py-2 text-[13px] font-medium text-white hover:bg-accentDark transition-colors disabled:opacity-50"
          >
            {creating ? 'Raising...' : 'Raise ticket'}
          </button>
        </form>
      </Card>

      {tickets.length > 0 && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <ChartCard title="Tickets by work type" icon={PieIcon}>
            {(() => {
              const byType = WORK_TYPES.map((w) => ({
                name: w.label,
                value: tickets.filter((t) => t.workType === w.value).length,
              })).filter((x) => x.value > 0);
              return (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={byType}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={42}
                      outerRadius={64}
                      paddingAngle={2}
                      label={({ name, value }) => `${name} ${value}`}
                      labelLine={false}
                    >
                      {byType.map((_, i) => (
                        <Cell key={i} fill={['#B8935A', '#14171B', '#7C9A92', '#C97B5E', '#8A6A3E', '#378ADD'][i % 6]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              );
            })()}
          </ChartCard>

          <ChartCard title="Tickets by priority" icon={TicketIcon}>
            {(() => {
              const byPriority = PRIORITIES.map((p) => ({
                name: p.charAt(0) + p.slice(1).toLowerCase(),
                count: tickets.filter((t) => t.priority === p).length,
              }));
              return (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={byPriority}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {byPriority.map((_, i) => (
                        <Cell
                          key={i}
                          fill={{ Low: '#71767C', Medium: '#378ADD', High: '#B8935A', Urgent: '#E24B4A' }[byPriority[i].name] || '#71767C'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </ChartCard>
        </div>
      )}

      <div className="space-y-2">
        {loading && (
          <Card className="p-8">
            <div className="mx-auto h-4 w-40 animate-pulse rounded bg-border/70" />
          </Card>
        )}
        {!loading && tickets.length === 0 && (
          <Card>
            <EmptyState message="No tickets yet. Raise one above." icon={TicketIcon} />
          </Card>
        )}
        {tickets.map((t) => (
          <Card key={t.id} className="overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge>
                  <Badge tone="gray">{WORK_TYPE_LABEL[t.workType]}</Badge>
                  <span className="text-[13px] font-medium text-ink">{t.title}</span>
                </div>
                <p className="mt-1 text-[12px] text-muted">
                  {formatDue(t.dueAt)} · Raised by {t.createdBy.name} · Assigned to {t.assignedTo.name}
                  {t.description && ` · ${t.description}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                  className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs text-muted hover:text-ink"
                >
                  <MessageCircle size={12} />
                  {expanded === t.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
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
            </div>
            {expanded === t.id && <CommentThread ticketId={t.id} />}
          </Card>
        ))}
      </div>
    </div>
  );
}
