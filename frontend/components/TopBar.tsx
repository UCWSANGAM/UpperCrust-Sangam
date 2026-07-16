'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { CommandSearchTrigger } from './ds/Input';
import { CommandPalette, useCommandPaletteShortcut } from './ds/CommandPalette';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/investors': 'Investors',
  '/sales': 'Sales',
  '/cross-sell': 'Cross-Sell Opportunities',
  '/reviews': 'Quarterly Reviews',
  '/tasks': 'Tasks & Meetings',
  '/tickets': 'Tickets',
  '/calendar': 'Calendar',
  '/import': 'Data Import',
  '/users': 'Users',
};

export default function TopBar() {
  const pathname = usePathname();
  const base = '/' + (pathname.split('/')[1] || '');
  const title = TITLES[base] || 'Sangam';
  const [paletteOpen, setPaletteOpen] = useState(false);

  useCommandPaletteShortcut(() => setPaletteOpen(true));

  return (
    <>
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-surface px-8">
        <p className="text-[13px] font-medium text-muted">{title}</p>
        <CommandSearchTrigger onClick={() => setPaletteOpen(true)} />
      </header>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
