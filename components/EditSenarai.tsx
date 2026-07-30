'use client';

import { useState } from 'react';
import { simpanSetting } from '@/app/actions/library';

export interface Kolum { key: string; label: string; type?: 'text' | 'number'; width?: string; }

// Editor senarai generik (yuran / timeline / dokumen) — simpan sebagai jsonb array.
export default function EditSenarai({
  councilCode, submissionType, kunci, tajuk, kolum, initial,
}: {
  councilCode: string; submissionType: string; kunci: string;
  tajuk: string; kolum: Kolum[]; initial: any[];
}) {
  const [rows, setRows] = useState<any[]>(Array.isArray(initial) && initial.length ? initial : []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [dirty, setDirty] = useState(false);

  const blank = () => Object.fromEntries(kolum.map((k) => [k.key, '']));
  const setCell = (i: number, key: string, v: any) => {
    setRows((p) => p.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));
    setDirty(true); setMsg('');
  };
  const addRow = () => { setRows((p) => [...p, blank()]); setDirty(true); };
  const delRow = (i: number) => { setRows((p) => p.filter((_, idx) => idx !== i)); setDirty(true); };

  async function save() {
    setBusy(true); setMsg('');
    const clean = rows.filter((r) => Object.values(r).some((v) => String(v ?? '').trim() !== ''));
    const res = await simpanSetting(councilCode, submissionType, kunci, clean);
    setBusy(false);
    if (res.ok) { setDirty(false); setRows(clean); setMsg('Disimpan ✓'); } else setMsg('Ralat: ' + res.error);
  }

  const inp = 'w-full border border-line bg-soft rounded-lg px-2.5 py-1.5 text-[13.5px] focus:border-brand focus:bg-white outline-none';

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">{tajuk}</div>
        <button onClick={save} disabled={busy || !dirty}
          className={`text-[12px] font-semibold px-3.5 py-1.5 rounded-full ${dirty ? 'bg-brand text-white hover:bg-brand-dark' : 'bg-soft text-ink-2'}`}>
          {busy ? '…' : dirty ? 'Simpan' : 'Tersimpan'}
        </button>
      </div>

      <div className="hidden sm:grid gap-2 mb-1.5" style={{ gridTemplateColumns: kolum.map((k) => k.width || '1fr').join(' ') + ' 32px' }}>
        {kolum.map((k) => <div key={k.key} className="text-[11px] font-semibold text-ink-2">{k.label}</div>)}
        <div />
      </div>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: kolum.map((k) => k.width || '1fr').join(' ') + ' 32px' }}>
            {kolum.map((k) => (
              <input key={k.key} className={inp} type={k.type === 'number' ? 'number' : 'text'}
                placeholder={k.label} value={r[k.key] ?? ''} onChange={(e) => setCell(i, k.key, e.target.value)} />
            ))}
            <button onClick={() => delRow(i)} className="text-ink-2 hover:text-brand text-lg leading-none">×</button>
          </div>
        ))}
        {rows.length === 0 && <div className="text-[13px] text-ink-2 py-1">Belum ada. Tekan "+ Tambah baris".</div>}
      </div>

      <div className="flex items-center gap-3 mt-3">
        <button onClick={addRow} className="text-[13px] font-semibold text-brand hover:text-brand-dark">+ Tambah baris</button>
        {msg && <span className="text-[12px] text-ink-2">{msg}</span>}
      </div>
    </div>
  );
}
