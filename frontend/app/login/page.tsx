'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const QUOTES = [
  { text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
  { text: 'The four most dangerous words in investing are: this time it\u2019s different.', author: 'Sir John Templeton' },
  { text: 'Risk comes from not knowing what you are doing.', author: 'Warren Buffett' },
  { text: 'The stock market is a device for transferring money from the impatient to the patient.', author: 'Warren Buffett' },
  { text: 'Someone is sitting in the shade today because someone planted a tree long ago.', author: 'Warren Buffett' },
  { text: 'It\u2019s not how much money you make, but how much money you keep.', author: 'Robert Kiyosaki' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % QUOTES.length);
    }, 6000);

    const expiredMsg = sessionStorage.getItem('sessionExpiredMessage');
    if (expiredMsg) {
      setError(expiredMsg);
      sessionStorage.removeItem('sessionExpiredMessage');
    }

    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      sessionStorage.setItem('accessToken', data.accessToken);
      sessionStorage.setItem('refreshToken', data.refreshToken);
      sessionStorage.setItem('userName', data.user?.name || '');
      sessionStorage.setItem('userRole', data.user?.role || '');
      router.push('/dashboard');
    } catch {
      setError('Invalid credentials');
    }
  }

  const quote = QUOTES[quoteIndex];

  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand + rotating quotes */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-sidebar p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, #B8935A 0%, transparent 40%), radial-gradient(circle at 80% 70%, #B8935A 0%, transparent 40%)',
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent font-display text-lg font-bold text-sidebar">
            S
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">UpperCrust Wealth</p>
            <p className="font-display text-xl text-white">Sangam</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <p
            key={quoteIndex}
            className="font-display text-[26px] leading-snug text-white transition-opacity duration-700"
          >
            &ldquo;{quote.text}&rdquo;
          </p>
          <p className="mt-4 text-sm text-accent">— {quote.author}</p>
          <div className="mt-8 flex gap-1.5">
            {QUOTES.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${i === quoteIndex ? 'w-6 bg-accent' : 'w-1.5 bg-white/20'}`}
              />
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-gray-500">
          Bespoke solutions for bespoke fund · AES-256 · JWT auth · Session-protected
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full items-center justify-center bg-background px-6 lg:w-1/2">
        <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent font-display text-base font-bold text-white">
              S
            </div>
            <p className="font-display text-xl text-ink">Sangam</p>
          </div>

          <p className="font-display text-2xl text-ink">Welcome back</p>
          <p className="mt-1 mb-6 text-[13px] text-muted">Sign in to your Sangam workspace</p>

          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">Email</label>
          <input
            className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            placeholder="you@uppercrustwealth.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">Password</label>
          <input
            className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <button className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accentDark">
            Sign in to Sangam
          </button>

          <p className="mt-6 text-center text-[11px] text-muted">
            Saarthi PMS Terminal · UpperCrust Wealth
          </p>
        </form>
      </div>
    </div>
  );
}
