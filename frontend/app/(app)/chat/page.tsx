'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader, Avatar } from '@/components/ui';

type Message = {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string };
};

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function load() {
    api.get('/chat/messages').then(({ data }) => setMessages(data));
  }

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post('/chat/messages', { content: text });
      setText('');
      load();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col p-8">
      <PageHeader title="Team Chat" subtitle="One shared channel for the whole desk" />

      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-surface p-4">
        {messages.length === 0 && <p className="text-sm text-muted">No messages yet — say hello.</p>}
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="flex items-start gap-3">
              <Avatar name={m.author.name} />
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[13px] font-medium text-ink">{m.author.name}</span>
                  <span className="text-[11px] text-muted">{timeLabel(m.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-[13px] text-ink">{m.content}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message the team..."
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accentDark transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
