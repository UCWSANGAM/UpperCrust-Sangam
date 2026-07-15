'use client';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/investors': 'Investors',
  '/sales': 'Sales',
  '/cross-sell': 'Cross-Sell Opportunities',
  '/reviews': 'Quarterly Reviews',
  '/tasks': 'Tasks & Meetings',
  '/calendar': 'Calendar',
  '/chat': 'Team Chat',
  '/import': 'Data Import',
  '/users': 'Users',
};

export default function TopBar() {
  const pathname = usePathname();
  const base = '/' + (pathname.split('/')[1] || '');
  const title = TITLES[base] || 'Sangam';

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-8">
      <p className="text-[13px] font-medium text-muted">{title}</p>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] text-muted">
        <Search size={13} />
        <span>Search coming soon</span>
      </div>
    </header>
  );
}
