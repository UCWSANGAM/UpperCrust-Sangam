'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Video, CheckSquare } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, PageHeader, Badge } from '@/components/ui';

type Task = {
  id: string;
  type: 'TASK' | 'MEETING';
  title: string;
  dueAt?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  assignee: { name: string };
  investor?: { name: string };
};

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  return new Date(date.setDate(diff));
}

function addDays(d: Date, n: number) {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));

  useEffect(() => {
    api.get('/tasks').then(({ data }) => setTasks(data));
  }, []);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="p-8">
      <PageHeader
        title="Calendar"
        subtitle="Weekly view of tasks and client meetings"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:text-ink"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setWeekStart(startOfWeek(new Date()))}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[12px] text-muted hover:text-ink"
            >
              Today
            </button>
            <button
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:text-ink"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-7 gap-3">
        {days.map((day) => {
          const dayTasks = tasks.filter((t) => t.dueAt && sameDay(new Date(t.dueAt), day));
          const isToday = sameDay(day, new Date());
          return (
            <Card key={day.toISOString()} className={`min-h-[220px] p-3 ${isToday ? 'border-accent' : ''}`}>
              <p className={`mb-2 text-[11px] font-medium uppercase ${isToday ? 'text-accentDark' : 'text-muted'}`}>
                {day.toLocaleDateString('en-IN', { weekday: 'short' })}
              </p>
              <p className={`mb-3 font-display text-lg ${isToday ? 'text-accentDark' : 'text-ink'}`}>
                {day.getDate()}
              </p>
              <div className="space-y-1.5">
                {dayTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`rounded-md border px-2 py-1.5 text-[11px] ${
                      t.status === 'DONE'
                        ? 'border-border bg-background text-muted line-through'
                        : t.type === 'MEETING'
                        ? 'border-accent/30 bg-accent/10 text-accentDark'
                        : 'border-border bg-background text-ink'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {t.type === 'MEETING' ? <Video size={12} /> : <CheckSquare size={12} />}
                      <span className="truncate">{t.title}</span>
                    </div>
                    {t.investor && <p className="mt-0.5 truncate text-[10px] opacity-70">{t.investor.name}</p>}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
