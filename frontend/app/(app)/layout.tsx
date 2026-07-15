'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopBar />
        <main className="min-h-screen flex-1 bg-background">{children}</main>
      </div>
    </div>
  );
}
