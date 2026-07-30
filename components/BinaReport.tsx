'use client';

import { useState, useRef } from 'react';
import {
  tambahArea, simpanArea, padamArea, uploadFoto, padamFoto,
  kemasAI, simpanMeta, janaReport,
} from '@/app/actions/report';
import { VERDICT_META } from '@/lib/approval/engine';

type Area = { id: number; title: string; note_raw: string; finding: string; action: string; photos: string[] };

export default function BinaReport({
  report, initialAreas, konteks, ownerPhone, siteUrl,
}: {
  report: any; initialAreas: Area[]; konteks: string; ownerPhone: string; siteUrl: string;
}) {
  const [verdict, setVerdict] = useState<string>(report.verdict || 'amber');
  const [ringkasan, setRingkasan] = useState<string>(report.ringkasan || '');
  const [isu, setIsu] = useState<string[]>(
    Array.isArray(report.isu_kritikal) ? report.isu_kritikal.map((x: any) => x.text ?? x) : [],
  );
  const [areas, setAreas] = useState<Area[]>(initialAreas);
  const [token, setToken] = useState<string>(report.token || '');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  const setArea = (id: number, patch: Partial<Area>) =>
    setAreas((p) => p.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  async function addArea() {
    setBusy('add');
    const r = await tambahArea(report.id, areas.length);
    setBusy('');
    if (r.ok) setAreas((p) => [...p, { ...r.area, photos: [] } as Area]);
    else setMsg(r.error);
  }

  async function delArea(id: number) {
    setAreas((p) => p.filter((a) => a.id !== id));
    await padamArea(id);
  }

  async function saveArea(a: Area) {
    await simpanArea(a.id, { title: a.title, note_raw: a.note_raw, finding: a.finding, action: a.action });
  }

  async function kemas(a: Area) {
    if (!a.note_raw?.trim()) { setMsg('Isi nota kasar dulu untuk area ni.'); return; }
    setBusy('ai' + a.id); setMsg('');
    const r = await kemasAI(a.title, a.note_raw, konteks);
    setBusy('');
    if (r.ok) {
      setArea(a.id, { finding: r.finding, action: r.action });
      await simpanArea(a.id, { finding: r.finding, action: r.action });
    } else setMsg('AI: ' + r.error);
  }

  function resize(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 1400;
          let { width, height } = img;
          if (width > height && width > max) { height = (height * max) / width; width = max; }
          else if (height > max) { width = (width * max) / height; height = max; }
          const cv = document.createElement('canvas');
          cv.width = width; cv.height = height;
          cv.getContext('2d')!.drawImage(img, 0, 0, width, height);
          resolve(cv.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject as any;
      reader.readAsDataURL(file);
    });
  }

  async function addFotos(a: Area, files: FileList | null) {
    if (!files?.length) return;
    setBusy('foto' + a.id); setMsg('');
    for (const f of Array.from(files)) {
      try {
        const dataUrl = await resize(f);
        const r = await uploadFoto(a.id, dataUrl);
        if (r.ok) setArea(a.id, { photos: [...(areas.find((x) => x.id === a.id)?.photos || []), r.url] });
        else setMsg('Foto: ' + r.error);
      } catch { setMsg('Gagal proses gambar.'); }
    }
    setBusy('');
  }

  async function delFoto(a: Area, url: string) {
    setArea(a.id, { photos: a.photos.filter((u) => u !== url) });
    await padamFoto(a.id, url);
  }

  async function saveMeta() {
    await simpanMeta(report.id, { verdict, ringkasan, isu_kritikal: isu.filter((x) => x.trim()).map((text) => ({ text })) });
  }

  async function jana() {
    setBusy('jana'); setMsg('');
    await saveMeta();
    for (const a of areas) await saveArea(a);
    const r = await janaReport(report.id, report.case_id);
    setBusy('');
    if (r.ok) { setToken(r.token); setMsg(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else setMsg(r.error);
  }

  const reportUrl = token ? `${siteUrl}/r/${token}` : '';
  const waPhone = (ownerPhone || '').replace(/\D/g, '').replace(/^0/, '60');
  const waText = encodeURIComponent(`Assalamualaikum. Ini laporan feasibility rumah anda daripada RENORUMAH:\n${reportUrl}`);
  const waLink = waPhone ? `https://wa.me/${waPhone}?text=${waText}` : `https://wa.me/?text=${waText}`;

  const input = 'w-full border border-line bg-white rounded-xl px-3 py-2.5 text-[15px] focus:border-brand outline-none';

  return (
    <div className="space-y-4">
      {token && (
        <div className="bg-[#e9f7ee] border border-[#bfe6cd] rounded-2xl p-4">
          <div className="text-[#146c37] font-bold mb-2">Report siap ✓ — hantar ke owner</div>
          <a href={waLink} target="_blank" className="inline-block bg-[#25D366] text-white text-sm font-semibold px-5 py-2.5 rounded-full mr-2">Hantar via WhatsApp</a>
          <a href={reportUrl} target="_blank" className="inline-block border border-[#bfe6cd] text-[#146c37] text-sm font-semibold px-4 py-2.5 rounded-full">Buka report</a>
          <div className="text-[12px] text-[#146c37] mt-2 break-all">{reportUrl}</div>
        </div>
      )}

      {/* VERDICT */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="text-sm font-semibold mb-2">Keputusan</div>
        <div className="flex gap-2">
          {(['green', 'amber', 'red'] as const).map((v) => (
            <button key={v} onClick={() => { setVerdict(v); }} onBlur={saveMeta}
              className={`text-[13px] font-semibold px-3.5 py-2 rounded-xl border ${verdict === v ? 'text-white border-transparent' : 'bg-soft text-ink-2 border-line'}`}
              style={verdict === v ? { backgroundColor: VERDICT_META[v].color } : undefined}>
              {VERDICT_META[v].label}
            </button>
          ))}
        </div>
        <textarea className={`${input} mt-3`} rows={2} value={ringkasan} onChange={(e) => setRingkasan(e.target.value)} onBlur={saveMeta} placeholder="Ringkasan / latar belakang ringkas (owner nampak di atas report)…" />
      </div>

      {/* AREAS */}
      <div className="space-y-3">
        {areas.map((a, i) => (
          <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-ink-2">AREA {i + 1}</span>
              <input className="flex-1 border-0 border-b border-line text-[15px] font-semibold outline-none focus:border-brand px-1 py-1"
                value={a.title} onChange={(e) => setArea(a.id, { title: e.target.value })} onBlur={() => saveArea(a)} placeholder="cth: Compound belakang" />
              <button onClick={() => delArea(a.id)} className="text-ink-2 hover:text-brand text-lg">×</button>
            </div>

            {/* Foto */}
            <div className="flex flex-wrap gap-2 mb-2">
              {a.photos.map((u) => (
                <div key={u} className="relative">
                  <img src={u} alt="" className="w-20 h-20 object-cover rounded-lg border border-line" />
                  <button onClick={() => delFoto(a, u)} className="absolute -top-1.5 -right-1.5 bg-ink text-white rounded-full w-5 h-5 text-[11px] leading-5">×</button>
                </div>
              ))}
              <FotoBtn busy={busy === 'foto' + a.id} onPick={(files) => addFotos(a, files)} />
            </div>

            <textarea className={input} rows={2} value={a.note_raw} onChange={(e) => setArea(a.id, { note_raw: e.target.value })} onBlur={() => saveArea(a)}
              placeholder="Nota kasar (taip atau guna mic phone)… cth: dinding retak, cat kelupas, kena demolish" />
            <button onClick={() => kemas(a)} disabled={busy === 'ai' + a.id}
              className="mt-2 text-[13px] font-semibold text-brand hover:text-brand-dark disabled:text-ink-2">
              {busy === 'ai' + a.id ? 'AI mengemas…' : '✦ Kemas dengan AI'}
            </button>

            {(a.finding || a.action) && (
              <div className="mt-2 space-y-2">
                <div><div className="text-[11px] font-bold text-ink-2">PENEMUAN</div>
                  <textarea className={input} rows={2} value={a.finding} onChange={(e) => setArea(a.id, { finding: e.target.value })} onBlur={() => saveArea(a)} /></div>
                <div><div className="text-[11px] font-bold text-ink-2">TINDAKAN</div>
                  <input className={input} value={a.action} onChange={(e) => setArea(a.id, { action: e.target.value })} onBlur={() => saveArea(a)} /></div>
              </div>
            )}
          </div>
        ))}
        <button onClick={addArea} disabled={busy === 'add'} className="w-full border border-dashed border-line rounded-2xl py-3 text-sm font-semibold text-brand hover:bg-white">
          {busy === 'add' ? '…' : '+ Tambah area'}
        </button>
      </div>

      {/* ISU KRITIKAL */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="text-sm font-semibold mb-2">Isu kritikal <span className="text-ink-2 font-normal text-xs">(pilihan)</span></div>
        {isu.map((t, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input className={input} value={t} onChange={(e) => setIsu((p) => p.map((x, idx) => (idx === i ? e.target.value : x)))} onBlur={saveMeta} placeholder="cth: Septik discaj ke longkang — wajib diselesaikan" />
            <button onClick={() => { setIsu((p) => p.filter((_, idx) => idx !== i)); saveMeta(); }} className="text-ink-2 text-lg">×</button>
          </div>
        ))}
        <button onClick={() => setIsu((p) => [...p, ''])} className="text-[13px] font-semibold text-brand">+ Tambah isu</button>
      </div>

      <div className="flex items-center gap-3 sticky bottom-3">
        <button onClick={jana} disabled={busy === 'jana'}
          className="flex-1 bg-brand hover:bg-brand-dark disabled:bg-line text-white font-semibold py-3.5 rounded-full shadow-lg">
          {busy === 'jana' ? 'Menjana…' : token ? 'Jana semula & hantar' : 'Jana & hantar report'}
        </button>
      </div>
      {msg && <p className="text-sm text-brand-dark">{msg}</p>}
    </div>
  );
}

function FotoBtn({ busy, onPick }: { busy: boolean; onPick: (f: FileList | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button onClick={() => ref.current?.click()} disabled={busy}
        className="w-20 h-20 rounded-lg border border-dashed border-line text-ink-2 text-[12px] flex flex-col items-center justify-center hover:bg-soft">
        {busy ? '…' : <><span className="text-xl leading-none">＋</span>Foto</>}
      </button>
      <input ref={ref} type="file" accept="image/*" capture="environment" multiple className="hidden"
        onChange={(e) => { onPick(e.target.files); e.currentTarget.value = ''; }} />
    </>
  );
}
