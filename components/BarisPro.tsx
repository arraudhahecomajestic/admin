'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setProviderStatus } from '@/app/actions/pro';

const PS: Record<string, { label: string; color: string; bg: string }> = {
  approved: { label: '✓ Diluluskan', color: '#146c37', bg: '#e9f7ee' },
  pending:  { label: '● Pending',    color: '#8a5a00', bg: '#fdf3e2' },
  rejected: { label: '✕ Ditolak',    color: '#C21F1C', bg: '#fdeeec' },
};

export default function BarisPro({ p }: { p: any }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  async function set(status: 'approved' | 'rejected' | 'pending') {
    setBusy(status); setMsg('');
    const r = await setProviderStatus(String(p.id), status);
    setBusy('');
    if (r.ok) router.refresh(); else setMsg(r.error || 'Ralat');
  }

  const ps = PS[p.status] ?? { label: p.status || '—', color: '#6E6E73', bg: '#f2f2f2' };
  const trades: string[] = Array.isArray(p.trades) ? p.trades : [];
  const areas: string[] = Array.isArray(p.service_areas) ? p.service_areas : [];
  const nama = p.kind === 'hero' ? (p.full_name || '(tiada nama)') : (p.company_name || '(tiada nama syarikat)');

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="font-semibold truncate">{nama}</span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-soft text-ink-2 uppercase">{p.kind}</span>
        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: ps.color, backgroundColor: ps.bg }}>{ps.label}</span>
      </div>
      <div className="text-ink-2 text-[12.5px] mt-0.5">
        {[p.entity_type, p.cidb_grade ? `CIDB ${p.cidb_grade}` : null, p.ssm_no ? `SSM ${p.ssm_no}` : null, p.ic_no ? `IC ${p.ic_no}` : null].filter(Boolean).join(' · ') || '—'}
      </div>
      <div className="text-ink-2 text-[12.5px]">{[p.pic_name, p.pic_phone, p.pic_email].filter(Boolean).join(' · ') || '—'}</div>
      {trades.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{trades.map((t) => <span key={t} className="text-[11px] bg-soft border border-line rounded-full px-2 py-0.5">{t}</span>)}</div>}
      {areas.length > 0 && <div className="text-ink-2 text-[11.5px] mt-1.5">Kawasan: {areas.join(', ')}</div>}

      <div className="flex items-center gap-2 mt-3">
        {p.status !== 'approved' && <button onClick={() => set('approved')} disabled={busy !== ''} className="bg-brand hover:bg-brand-dark disabled:bg-line text-white text-[13px] font-semibold px-4 py-2 rounded-full">{busy === 'approved' ? '…' : '✓ Luluskan'}</button>}
        {p.status !== 'rejected' && <button onClick={() => set('rejected')} disabled={busy !== ''} className="border border-line text-ink-2 text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-soft">{busy === 'rejected' ? '…' : 'Tolak'}</button>}
        {p.status !== 'pending' && <button onClick={() => set('pending')} disabled={busy !== ''} className="text-ink-2 text-[12px] hover:text-brand-dark px-1">↩ pending</button>}
        {msg && <span className="text-[12px] text-brand-dark">{msg}</span>}
      </div>
    </div>
  );
}
