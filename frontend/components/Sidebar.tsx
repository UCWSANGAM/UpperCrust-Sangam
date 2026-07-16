'use client';
import { useEffect, useState } from 'react';
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
  Ticket as TicketIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Grouped per the Phase 2 navigation spec — Home / Clients / Portfolio / Review /
// Operations / Admin. Routes are unchanged so no existing page is affected.
const GROUPS: { label: string; items: { href: string; label: string; icon: any; adminOnly?: boolean }[] }[] = [
  { label: 'Home', items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'Clients', items: [{ href: '/investors', label: 'Investors', icon: Users }] },
  {
    label: 'Portfolio',
    items: [
      { href: '/sales', label: 'Sales', icon: TrendingUp },
      { href: '/cross-sell', label: 'Cross-Sell', icon: Sparkles },
    ],
  },
  { label: 'Review', items: [{ href: '/reviews', label: 'Quarterly Reviews', icon: ClipboardCheck }] },
  {
    label: 'Operations',
    items: [
      { href: '/tasks', label: 'Tasks & Meetings', icon: CalendarClock },
      { href: '/tickets', label: 'Tickets', icon: TicketIcon },
      { href: '/calendar', label: 'Calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'Admin',
    items: [
      { href: '/import', label: 'Data Import', icon: Upload, adminOnly: true },
      { href: '/users', label: 'Users', icon: UserCog },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setRole(sessionStorage.getItem('userRole') || '');
    setCollapsed(localStorage.getItem('sidebarCollapsed') === 'true');
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebarCollapsed', String(next));
  }

  function signOut() {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    router.push('/login');
  }

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col justify-between bg-sidebar py-5 transition-all duration-200 ${
        collapsed ? 'w-16 px-2' : 'w-60 px-3'
      }`}
    >
      <div>
        <div className={`mb-8 flex items-center gap-2.5 px-1 ${collapsed ? 'justify-center' : ''}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent font-display text-sm font-bold text-sidebar">
            S
          </div>
          {!collapsed && (
            <div>
              <p className="text-[9px] font-medium uppercase tracking-wider text-gray-500">UpperCrust Wealth</p>
              <p className="font-display text-[17px] leading-none text-white">Sangam</p>
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-4">
          {GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => !item.adminOnly || role === 'SUPER_ADMIN');
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.label}>
                {!collapsed && (
                  <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-600">{group.label}</p>
                )}
                <div className="flex flex-col gap-0.5">
                  {visibleItems.map((item) => {
                    const active = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors duration-150 ${
                          collapsed ? 'justify-center' : ''
                        } ${
                          active ? 'bg-accent/15 font-medium text-accent' : 'text-gray-300 hover:bg-sidebarHover hover:text-white'
                        }`}
                      >
                        <Icon size={16} strokeWidth={2} />
                        {!collapsed && item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-0.5">
        <button
          onClick={toggleCollapsed}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-gray-500 hover:bg-sidebarHover hover:text-white ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && 'Collapse'}
        </button>
        <button
          onClick={signOut}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-gray-500 hover:bg-sidebarHover hover:text-white ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut size={16} strokeWidth={2} />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
