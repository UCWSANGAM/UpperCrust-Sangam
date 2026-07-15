'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  ClipboardCheck,
  CalendarClock,
  CalendarDays,
  Upload,
  UserCog,
  LogOut,
  Sparkles,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/investors', label: 'Investors', icon: Users },
  { href: '/sales', label: 'Sales', icon: TrendingUp },
  { href: '/cross-sell', label: 'Cross-Sell', icon: Sparkles },
  { href: '/reviews', label: 'Quarterly Reviews', icon: ClipboardCheck },
  { href: '/tasks', label: 'Tasks & Meetings', icon: CalendarClock },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/import', label: 'Data Import', icon: Upload },
  { href: '/users', label: 'Users', icon: UserCog },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function signOut() {
    sessionStorage.removeItem('accessToken');
    router.push('/login');
  }

  return (
    <aside className="flex h-screen w-60 flex-col justify-between bg-sidebar px-3 py-5">
      <div>
        <div className="mb-8 flex items-center gap-2.5 px-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-display text-sm font-bold text-sidebar">
            S
          </div>
          <div>
            <p className="text-[9px] font-medium uppercase tracking-wider text-gray-500">UpperCrust Wealth</p>
            <p className="font-display text-[17px] leading-none text-white">Sangam</p>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                  active
                    ? 'bg-accent/15 font-medium text-accent'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={16} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <button
        onClick={signOut}
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-gray-500 hover:bg-white/5 hover:text-white"
      >
        <LogOut size={16} strokeWidth={2} />
        Sign out
      </button>
    </aside>
  );
}
