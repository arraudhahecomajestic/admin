'use client';

import { useState } from 'react';
import { simpanProfil } from '@/app/actions/library';

export default function EditProfil({ row, label }: { row: any; label: string }) {
  const [rear, setRear] = useState(row.setback_rear_ft ?? '');
  const [side, setSide] = useState(row.setback_side_ft ?? '');
  const [front, setFront] = useState(row.setback_front_ft ?? '');
  const [cov, setCov] = useState(row.max_coverage_pct ?? '');
  const [pe, setPe] = useState<boolean | null>(row.needs_pe_double ?? null);
  const [consent, setConsent] = useState<boolean | null>(row.neighbour_consent_required ?? null);
  const [notes, setNotes] = useState(row.notes ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [dirty, setDirty] = useState(false);

  const mark = (fn: (v: any) => void) => (v: any) => { fn(v); setDirty(true); setMsg(''); };

  async function save() {
    setBusy(true); setMsg('');
    const res = await simpanProfil({
      id: row.id, setback_rear_ft: rear, setback_side_ft: side, setback_front_ft: front,
      max_coverage_pct: cov, needs_pe_double: pe, neighbour_consent_required: consent, notes,
    });
    setBusy(false);
    if (res.ok) { setDirty(false); setMsg('Disimpan ✓'); } else setMsg('Ralat: ' + res.error);
  }

  const inp = 'w-full border border-line bg-soft rounded-lg px-2.5 py-2 text-[14px] focus:border-brand focus:bg-white outline-none';
  const lab = 'block text-[11px] font-semibold text-ink-2 mb-1';
  const Tri = ({ val, set }: { val: boolean | null; set: (v: boolean | null) => void }) => (
    <div className="flex gap-1">
      {[['Ya', true], ['Tak', false], ['?', null]].map(([t, v]) => (
        <button key={t as string} type="button" onClick={() => set(v as any)}
          className={`text-[12px] font-semibold px-2.5 py-1.5 rounded-lg border ${
            val === v ? 'bg-ink text-white border-transparent' : 'bg-soft text-ink-2 border-line'}`}>{t as string}</button>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">{label}</div>
        <button onClick={save} disabled={busy || !dirty}
          className={`text-[12px] font-semibold px-3.5 py-1.5 rounded-full ${dirty ? 'bg-brand text-white hover:bg-brand-dark' : 'bg-soft text-ink-2'}`}>
          {busy ? '…' : dirty ? 'Simpan' : 'Tersimpan'}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div><label className={lab}>Setback belakang (kaki)</label><input className={inp} value={rear} onChange={(e) => mark(setRear)(e.target.value)} /></div>
        <div><label className={lab}>Setback tepi (kaki)</label><input className={inp} value={side} onChange={(e) => mark(setSide)(e.target.value)} /></div>
        <div><label className={lab}>Setback depan (kaki)</label><input className={inp} value={front} onChange={(e) => mark(setFront)(e.target.value)} /></div>
        <div><label className={lab}>Max coverage (%)</label><input className={inp} value={cov} onChange={(e) => mark(setCov)(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        <div><label className={lab}>Perlu jurutera (PE)?</label><Tri val={pe} set={mark(setPe)} /></div>
        <div><label className={lab}>Perlu consent jiran?</label><Tri val={consent} set={mark(setConsent)} /></div>
      </div>
      <div className="mt-3"><label className={lab}>Nota</label><input className={inp} value={notes} onChange={(e) => mark(setNotes)(e.target.value)} placeholder="pengecualian, syarat khas…" /></div>
      {msg && <div className="text-[12px] text-ink-2 mt-2">{msg}</div>}
    </div>
  );
}
