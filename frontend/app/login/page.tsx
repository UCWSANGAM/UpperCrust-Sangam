'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      sessionStorage.setItem('accessToken', data.accessToken);
      router.push('/dashboard');
    } catch {
      setError('Invalid credentials');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-accent font-display text-base font-bold text-white">
            S
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">UpperCrust Wealth</p>
            <p className="font-display text-xl text-ink">SANGAM</p>
          </div>
        </div>
        <input
          className="mb-3 w-full rounded border border-border bg-background px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="mb-3 w-full rounded border border-border bg-background px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-accent py-2 text-sm font-medium text-white hover:bg-accentDark transition-colors">
          Sign in
        </button>
      </form>
    </div>
  );
}
