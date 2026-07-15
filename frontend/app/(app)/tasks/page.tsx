'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, PageHeader, Badge, Avatar } from '@/components/ui';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

type Task = {
  id: string;
  type: 'TASK' | 'MEETING';
  title: string;
  notes?: string;
  dueAt?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  assignee: { name: string };
  investor?: { name: string };
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string };
};

type RmOption = { id: string; name: string };

function formatDue(iso?: string) {
  if (!iso) return 'No due date';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const STATUS_TONE: Record<string, 'gold' | 'blue' | 'green'> = {
  OPEN: 'gold',
  IN_PROGRESS: 'blue',
  DONE: 'green',
};

function CommentThread({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    api.get(`/tasks/${taskId}/comments`).then(({ data }) => setComments(data));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api.post(`/tasks/${taskId}/comments`, { content: text });
      setText('');
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-border bg-background/40 p-4">
      <div className="space-y-2">
        {comments.length === 0 && <p className="text-[12px] text-muted">No follow-ups yet.</p>}
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
          placeholder="Add a follow-up..."
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accentDark transition-colors disabled:opacity-50"
        >
          Post
        </button>
      </form>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rms, setRms] = useState<RmOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', notes: '', dueAt: '', type: 'TASK' as 'TASK' | 'MEETING', assigneeId: '' });
  const [creating, setCreating] = useState(false);

  function load() {
    api.get('/tasks').then(({ data }) => setTasks(data)).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    api.get('/users').then(({ data }) => setRms(data)).catch(() => {});
  }, []);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      await api.post('/tasks', {
        title: form.title,
        notes: form.notes || undefined,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
        type: form.type,
        assigneeId: form.assigneeId || undefined,
      });
      setForm({ title: '', notes: '', dueAt: '', type: 'TASK', assigneeId: '' });
      load();
    } finally {
      setCreating(false);
    }
  }

  async function setStatus(id: string, status: string) {
    await api.patch(`/tasks/${id}`, { status });
    load();
  }

  const open = tasks.filter((t) => t.status !== 'DONE');
  const done = tasks.filter((t) => t.status === 'DONE');

  return (
    <div className="p-8">
      <PageHeader title="Tasks & meetings" subtitle={`${open.length} open, ${done.length} completed`} />

      <Card className="mb-8 max-w-2xl p-5">
        <form onSubmit={createTask} className="grid grid-cols-2 gap-3">
          <input
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            type="datetime-local"
            value={form.dueAt}
            onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as 'TASK' | 'MEETING' })}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="TASK">Task</option>
            <option value="MEETING">Meeting</option>
          </select>
          <select
            value={form.assigneeId}
            onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
            className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Assign to myself</option>
            {rms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={creating}
            className="col-span-2 rounded-lg bg-accent py-2 text-sm font-medium text-white hover:bg-accentDark transition-colors disabled:opacity-50"
          >
            {creating ? 'Adding...' : 'Add'}
          </button>
        </form>
      </Card>

      <div className="space-y-2">
        {loading && <p className="text-sm text-muted">Loading...</p>}
        {!loading && tasks.length === 0 && <p className="text-sm text-muted">No tasks yet.</p>}
        {tasks.map((t) => (
          <Card key={t.id} className="overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-[13px] font-medium text-ink">
                  <span className="mr-2 text-[10px] uppercase text-muted">{t.type === 'MEETING' ? 'Meeting' : 'Task'}</span>
                  {t.title}
                </p>
                <p className="mt-1 text-[12px] text-muted">
                  {formatDue(t.dueAt)} · {t.assignee.name}
                  {t.investor && ` · ${t.investor.name}`}
                  {t.notes && ` · ${t.notes}`}
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
            {expanded === t.id && <CommentThread taskId={t.id} />}
          </Card>
        ))}
      </div>
    </div>
  );
}
