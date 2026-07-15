'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, PageHeader, Badge, Avatar, EmptyState } from '@/components/ui';
import { UserPlus } from 'lucide-react';

const ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'BRANCH_MANAGER',
  'RELATIONSHIP_MANAGER',
  'OPERATIONS',
  'RESEARCH',
  'COMPLIANCE',
];

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'RELATIONSHIP_MANAGER' });
  const [creating, setCreating] = useState(false);

  function load() {
    api
      .get('/users')
      .then(({ data }) => setUsers(data))
      .catch(() => setError('Could not load users — you may not have permission to view this page.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await api.post('/users', form);
      setForm({ name: '', email: '', password: '', role: 'RELATIONSHIP_MANAGER' });
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not create user');
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(user: User) {
    await api.patch(`/users/${user.id}`, { isActive: !user.isActive });
    load();
  }

  return (
    <div className="p-8">
      <PageHeader title="Users" subtitle="Add relationship managers and staff, assign roles" />

      <Card className="mb-8 max-w-2xl p-5">
        <form onSubmit={createUser} className="grid grid-cols-2 gap-3">
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-accent"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-accent"
          />
          <input
            required
            type="password"
            placeholder="Temporary password (min 8 chars)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-accent"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="rounded-lg border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-accent"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={creating}
            className="col-span-2 rounded-lg bg-accent py-2 text-[13px] font-medium text-white hover:bg-accentDark transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Add user'}
          </button>
          {error && <p className="col-span-2 text-[13px] text-red-600">{error}</p>}
        </form>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-background/60 text-left text-[11px] font-medium uppercase tracking-wide text-muted">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-5 py-8">
                  <div className="mx-auto h-4 w-40 animate-pulse rounded bg-border/70" />
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState message="No users yet." icon={UserPlus} />
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-background/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} />
                    <span className="font-medium text-ink">{u.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted">{u.email}</td>
                <td className="px-5 py-3">
                  <Badge tone="gray">{u.role.replace(/_/g, ' ')}</Badge>
                </td>
                <td className="px-5 py-3">
                  <Badge tone={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Deactivated'}</Badge>
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => toggleActive(u)} className="text-[12px] font-medium text-accentDark hover:underline">
                    {u.isActive ? 'Deactivate' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
