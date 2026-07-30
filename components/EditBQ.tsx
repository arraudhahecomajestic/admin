'use client';

import { useState } from 'react';
import { simpanBQ } from '@/app/actions/bq';

interface Item {
  scope_code: string;
  description: string;
  qty: number;
  unit: string | null;
  rate: number;
  amount: number;
  kategori: string;
}

export default function EditBQ({ projectId, initialItems }: { projectId: string; initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const subtotal = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  function upd(idx: number, field: 'qty' | 'rate', v: string) {
    setItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it;
      const n = { ...it, [field]: Number(v) || 0 };
      n.amount = Math.round((Number(n.qty) || 0) * (Number(n.rate) || 0) * 100) / 100;
      return n;
    }));
  }

  async function simpan() {
    setBusy(true); setMsg('');
    const res = await simpanBQ(projectId, items);
    setBusy(false);
    setMsg(res.ok ? 'Disimpan ✓' : 'Ralat: ' + res.error);
  }

  const rm = (x: number) => 'RM ' + Math.round(x).toLocaleString('en-MY');

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wide text-ink-2 font-bold">Bill of Quantities</div>
        <button onClick={simpan} disabled={busy} className="bg-brand hover:bg-brand-dark disabled:bg-line text-white text-[13px] font-semibold px-4 py-1.5 rounded-full">
          {busy ? '…' : 'Simpan'}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="p-4 text-ink-2 text-sm">Tiada item BQ.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-2 text-[11px] uppercase bg-soft">
              <th className="px-4 py-2">Kerja</th>
              <th className="px-2 py-2 w-20 text-right">Qty</th>
              <th className="px-2 py-2 w-24 text-right">Rate</th>
              <th className="px-4 py-2 w-28 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-t border-line">
                <td className="px-4 py-2">{it.description}<span className="text-ink-2 text-[11px] block">{it.kategori}{it.unit ? ` · ${it.unit}` : ''}</span></td>
                <td className="px-2 py-2"><input type="number" value={it.qty} onChange={(e) => upd(i, 'qty', e.target.value)} className="w-full text-right border border-line rounded px-1.5 py-1" /></td>
                <td className="px-2 py-2"><input type="number" value={it.rate} onChange={(e) => upd(i, 'rate', e.target.value)} className="w-full text-right border border-line rounded px-1.5 py-1" /></td>
                <td className="px-4 py-2 text-right font-semibold">{Math.round(it.amount).toLocaleString('en-MY')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line bg-soft">
              <td className="px-4 py-3 font-bold" colSpan={3}>Subtotal</td>
              <td className="px-4 py-3 text-right font-bold">{rm(subtotal)}</td>
            </tr>
          </tfoot>
        </table>
      )}
      {msg && <div className="px-4 py-2 text-[13px] text-ink-2">{msg}</div>}
    </div>
  );
}
