'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/investors', label: 'Investors' },
  { href: '/sales', label: 'Sales' },
  { href: '/reviews', label: 'Quarterly Reviews' },
  { href: '/tasks', label: 'Tasks & Meetings' },
  { href: '/import', label: 'Data Import' },
  { href: '/users', label: 'Users' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function signOut() {
    sessionStorage.removeItem('accessToken');
    router.push('/login');
  }

  return (
    <aside className="flex h-screen w-56 flex-col justify-between bg-sidebar px-4 py-6">
      <div>
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-accent font-display text-sm font-bold text-sidebar">
            S
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">UpperCrust Wealth</p>
            <p className="font-display text-lg text-white">SANGAM</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-3 py-2 text-sm transition-colors ${
                  active ? 'bg-accent/20 text-accent' : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <button
        onClick={signOut}
        className="rounded px-3 py-2 text-left text-sm text-gray-400 hover:bg-white/5 hover:text-white"
      >
        Sign out
      </button>
    </aside>
  );
}
