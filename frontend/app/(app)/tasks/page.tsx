'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

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

function formatDue(iso?: string) {
  if (!iso) return 'No due date';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'text-amber-700',
  IN_PROGRESS: 'text-blue-700',
  DONE: 'text-green-700',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', notes: '', dueAt: '', type: 'TASK' as 'TASK' | 'MEETING' });
  const [creating, setCreating] = useState(false);

  function load() {
    api
      .get('/tasks')
      .then(({ data }) => setTasks(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
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
      });
      setForm({ title: '', notes: '', dueAt: '', type: 'TASK' });
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
      <h1 className="font-display text-3xl text-ink">Tasks & meetings</h1>
      <p className="mt-1 text-sm text-muted">{open.length} open, {done.length} completed</p>

      <form onSubmit={createTask} className="mt-6 grid max-w-2xl grid-cols-2 gap-3 rounded-lg border border-border bg-surface p-5">
        <input
          required
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="col-span-2 rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="col-span-2 rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          type="datetime-local"
          value={form.dueAt}
          onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
          className="rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as 'TASK' | 'MEETING' })}
          className="rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="TASK">Task</option>
          <option value="MEETING">Meeting</option>
        </select>
        <button
          type="submit"
          disabled={creating}
          className="col-span-2 rounded bg-accent py-2 text-sm font-medium text-white hover:bg-accentDark transition-colors disabled:opacity-50"
        >
          {creating ? 'Adding...' : 'Add'}
        </button>
      </form>

      <div className="mt-8 space-y-2">
        {loading && <p className="text-sm text-muted">Loading...</p>}
        {!loading && tasks.length === 0 && <p className="text-sm text-muted">No tasks yet.</p>}
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
            <div>
              <p className="text-sm font-medium text-ink">
                <span className="mr-2 text-xs text-muted uppercase">{t.type === 'MEETING' ? 'Meeting' : 'Task'}</span>
                {t.title}
              </p>
              <p className="mt-1 text-xs text-muted">
                {formatDue(t.dueAt)}
                {t.investor && ` · ${t.investor.name}`}
                {t.notes && ` · ${t.notes}`}
              </p>
            </div>
            <select
              value={t.status}
              onChange={(e) => setStatus(t.id, e.target.value)}
              className={`rounded border border-border bg-background px-2 py-1 text-xs outline-none ${STATUS_STYLES[t.status]}`}
            >
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
