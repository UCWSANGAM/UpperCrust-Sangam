'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

function UploadCard({ label, endpoint }: { label: string; endpoint: string }) {
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
      const { data } = await api.post(endpoint, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus(`Done: ${JSON.stringify(data)}`);
    } catch (err: any) {
      setStatus(err?.response?.data?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h2 className="mb-3 font-display text-lg text-accent">{label}</h2>
      <input
        type="file"
        accept=".xlsx,.xls"
        disabled={busy}
        onChange={handleFile}
        className="text-sm text-muted"
      />
      {busy && <p className="mt-2 text-sm text-muted">Uploading...</p>}
      {status && <p className="mt-2 text-xs text-muted break-all">{status}</p>}
    </div>
  );
}

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="mb-6 font-display text-3xl text-accent">Data Import</h1>
      <div className="grid max-w-xl gap-4">
        <UploadCard label="Investor List" endpoint="/import/investor-list" />
        <UploadCard label="Live Folio Report" endpoint="/import/folio-report" />
      </div>
      <p className="mt-6 max-w-xl text-sm text-muted">
        Upload the Investor List first, then the Folio Report — folios link to investors
        by name. Re-uploading the Investor List updates existing records by UCC; re-uploading
        the Folio Report skips folios that already exist.
      </p>
    </div>
  );
}
