'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type RmSales = {
  rmId: string;
  rmName: string;
  investorCount: number;
  totalAum: number;
  netSalesFY: number;
  grossSalesFY: number;
  redemptionsFY: number;
  netSalesCY: number;
  grossSalesCY: number;
  redemptionsCY: number;
};

function formatCr(value: number) {
  return `₹${(value / 10000000).toFixed(2)} Cr`;
}

export default function SalesPage() {
  const [rows, setRows] = useState<RmSales[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/investors/sales-by-rm')
      .then(({ data }) => setRows(data))
      .finally(() => setLoading(false));
  }, []);

  const totals = rows.reduce(
    (acc, r) => ({
      netSalesFY: acc.netSalesFY + r.netSalesFY,
      netSalesCY: acc.netSalesCY + r.netSalesCY,
      totalAum: acc.totalAum + r.totalAum,
    }),
    { netSalesFY: 0, netSalesCY: 0, totalAum: 0 },
  );

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl text-ink">Sales by RM</h1>
      <p className="mt-1 text-sm text-muted">
        {rows.length} RMs · Team Net Sales FY {formatCr(totals.netSalesFY)} · AUM {formatCr(totals.totalAum)}
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background/50 text-left text-xs uppercase text-muted">
              <th className="px-4 py-3">RM</th>
              <th className="px-4 py-3 text-right">Clients</th>
              <th className="px-4 py-3 text-right">AUM</th>
              <th className="px-4 py-3 text-right">Net Sales FY</th>
              <th className="px-4 py-3 text-right">Gross Sales FY</th>
              <th className="px-4 py-3 text-right">Redemptions FY</th>
              <th className="px-4 py-3 text-right">Net Sales CY</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted">Loading...</td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted">
                  No sales data yet — upload the investor data file under Data Import.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.rmId} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{r.rmName}</td>
                <td className="px-4 py-3 text-right text-muted">{r.investorCount}</td>
                <td className="px-4 py-3 text-right font-display text-ink">{formatCr(r.totalAum)}</td>
                <td className="px-4 py-3 text-right font-display text-ink">{formatCr(r.netSalesFY)}</td>
                <td className="px-4 py-3 text-right text-muted">{formatCr(r.grossSalesFY)}</td>
                <td className="px-4 py-3 text-right text-red-600">{formatCr(r.redemptionsFY)}</td>
                <td className="px-4 py-3 text-right text-muted">{formatCr(r.netSalesCY)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
