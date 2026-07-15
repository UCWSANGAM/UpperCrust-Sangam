'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Card, PageHeader } from '@/components/ui';

type Job = {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
  totalRows: number;
  processedRows: number;
  created: number;
  updated: number;
  unmatchedRMs?: string[];
  errorMessage?: string;
};

export default function ImportPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function pollJob(jobId: string) {
    pollRef.current = setInterval(async () => {
      const { data } = await api.get(`/import/jobs/${jobId}`);
      setJob(data);
      if (data.status === 'DONE' || data.status === 'FAILED') {
        if (pollRef.current) clearInterval(pollRef.current);
        setBusy(false);
      }
    }, 1500);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    setJob(null);
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await api.post('/import/investor-list', form);
      pollJob(data.jobId);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Upload failed to start');
      setBusy(false);
    }
  }

  const pct = job && job.totalRows > 0 ? Math.round((job.processedRows / job.totalRows) * 100) : 0;

  return (
    <div className="p-8">
      <PageHeader title="Data Import" />
      <Card className="max-w-xl p-6">
        <h2 className="mb-3 font-display text-lg text-ink">Daily Investor Data</h2>
        <p className="mb-4 text-sm text-muted">
          One file, uploaded daily — profile, AUM, XIRR, sales figures, and needs-gap data all
          update in one go. RM ownership is matched from the Partner/Employee column. Runs in
          the background, so large files (5,000+ rows) are safe to upload.
        </p>
        <input
          type="file"
          accept=".xlsx,.xls"
          disabled={busy}
          onChange={handleFile}
          className="text-sm text-muted"
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {job && (
          <div className="mt-5">
            {job.status !== 'DONE' && job.status !== 'FAILED' && (
              <>
                <div className="mb-2 flex items-center justify-between text-xs text-muted">
                  <span>{job.status === 'PENDING' ? 'Starting...' : 'Processing...'}</span>
                  <span>{job.processedRows} / {job.totalRows || '?'} rows</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                  <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                </div>
              </>
            )}

            {job.status === 'DONE' && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                Done — created {job.created}, updated {job.updated} of {job.totalRows} rows.
                {job.unmatchedRMs && job.unmatchedRMs.length > 0 && (
                  <p className="mt-1 text-xs text-emerald-700">
                    RM names not found: {job.unmatchedRMs.join(', ')} — add them under Users first, matching the name exactly, then re-upload.
                  </p>
                )}
              </div>
            )}

            {job.status === 'FAILED' && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Import failed: {job.errorMessage || 'Unknown error'}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
