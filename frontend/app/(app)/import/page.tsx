'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function ImportPage() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus('');
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await api.post('/import/investor-list', form);
      const unmatched = data.unmatchedRMs?.length
        ? ` — RM names not found: ${data.unmatchedRMs.join(', ')} (add them under Users first, matching the name exactly)`
        : '';
      setStatus(`Done — created ${data.created ?? 0}, updated ${data.updated ?? 0} of ${data.total ?? 0} rows${unmatched}`);
    } catch (err: any) {
      setStatus(err?.response?.data?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 font-display text-3xl text-ink">Data Import</h1>
      <div className="max-w-xl rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-3 font-display text-lg text-ink">Daily Investor Data</h2>
        <p className="mb-4 text-sm text-muted">
          One file, uploaded daily — profile, AUM, XIRR, sales figures, and needs-gap data all
          update in one go. RM ownership is matched from the Partner/Employee column.
        </p>
        <input
          type="file"
          accept=".xlsx,.xls"
          disabled={busy}
          onChange={handleFile}
          className="text-sm text-muted"
        />
        {busy && <p className="mt-2 text-sm text-muted">Uploading...</p>}
        {status && <p className="mt-3 text-xs text-ink break-all">{status}</p>}
      </div>
    </div>
  );
}
