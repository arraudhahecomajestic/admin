'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { simpanTetapan } from '@/app/actions/tetapan';
import { computePnL } from '@/lib/wang';
import type { Tetapan } from '@/lib/tetapan';

export default function BorangTetapan({ initial }: { initial: Tetapan }) {
  const router = useRouter();
  const [margin, setMargin] = useState(String(initial.margin_pct));
  const [reserve, setReserve] = useState(String(initial.reserve_pct));
  const [frontEnd, setFrontEnd] = useState(String(initial.kos_frontend));
  const [deposit, setDeposit] = useState((initial.jadual_deposit || [50, 45, 5]).join(', '));
  const [waranti, setWaranti] = useState(initial.skop_waranti || 'waterproofing');
  const [hargaReport, setHargaReport] = useState(String(initial.harga_report_rm ?? 250));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const cur: Tetapan = {
    margin_pct: Number(margin) || 0,
    reserve_pct: Number(reserve) || 0,
    kos_frontend: Number(frontEnd) || 0,
    jadual_deposit: deposit.split(',').map((x) => Number(x.trim())).filter((x) => !isNaN(x)),
    skop_waranti: waranti,
    harga_report_rm: Number(hargaReport) || 250,
  };
  const rm = (x: number) => 'RM ' + Math.round(x).toLocaleString('en-MY');
  const big = computePnL(100000, cur);
  const small = computePnL(30000, cur);

  async function simpan() {
    setBusy(true); setMsg('');
    const res = await simpanTetapan(cur);
    setBusy(false);
    setMsg(res.ok ? 'Disimpan ✓ — P&L semua projek dikemas kini.' : 'Ralat: ' + res.error);
    if (res.ok) router.refresh();
  }

  const input = 'w-full border border-line bg-soft rounded-xl px-3.5 py-3 text-[15px] focus:border-brand focus:bg-white outline-none';
  const label = 'block text-sm font-semibold mb-1.5';

  return (
    <div>
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Margin RR (%)</label><input type="number" step="0.5" className={input} value={margin} onChange={(e) => setMargin(e.target.value)} /></div>
          <div><label className={label}>Reserve waranti (%)</label><input type="number" step="0.5" className={input} value={reserve} onChange={(e) => setReserve(e.target.value)} /></div>
        </div>
        <div><label className={label}>Kos front-end (RM) <span className="text-ink-2 font-normal text-xs">— site visit + BQ + design</span></label><input type="number" className={input} value={frontEnd} onChange={(e) => setFrontEnd(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Jadual deposit (%)</label><input className={input} value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="50, 45, 5" /></div>
          <div><label className={label}>Skop waranti</label><input className={input} value={waranti} onChange={(e) => setWaranti(e.target.value)} /></div>
        </div>
        <div><label className={label}>Harga Laporan Feasibility (RM) <span className="text-ink-2 font-normal text-xs">— deposit approval checker</span></label><input type="number" className={input} value={hargaReport} onChange={(e) => setHargaReport(e.target.value)} /></div>
      </div>

      <div className="bg-[#111] text-white rounded-2xl p-5 mt-4">
        <div className="text-[11px] uppercase tracking-wide text-white/50 font-bold mb-3">Kesan pada untung bersih RR (live)</div>
        <div className="grid grid-cols-2 gap-4">
          <Pv title="Projek besar (RM100k)" pnl={big} rm={rm} />
          <Pv title="Projek kecil (RM30k)" pnl={small} rm={rm} />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button disabled={busy} onClick={simpan} className="bg-brand hover:bg-brand-dark disabled:bg-line text-white text-sm font-semibold px-6 py-3 rounded-full">
          {busy ? 'Menyimpan…' : 'Simpan settings'}
        </button>
        {msg && <span className="text-sm text-ink-2">{msg}</span>}
      </div>
    </div>
  );
}

function Pv({ title, pnl, rm }: { title: string; pnl: any; rm: (x: number) => string }) {
  return (
    <div>
      <div className="text-[12px] text-white/60 mb-1">{title}</div>
      <div className={`text-2xl font-bold ${pnl.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>{rm(pnl.net)}</div>
      <div className="text-[11px] text-white/40 mt-0.5">margin {rm(pnl.margin)} · net {pnl.netPct}%</div>
    </div>
  );
}
