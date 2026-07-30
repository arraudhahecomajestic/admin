'use client';

import { useState } from 'react';
import { semakApproval, mulaBayar, type SemakResult } from '@/app/actions/approval';
import {
  JENIS_RUMAH_APPROVAL, TINGKAT, JENIS_KERJA, YA_TAK_TAKPASTI,
  HAKMILIK, BILA_MULA, KEDUDUKAN_LOT, AREA_WORKS, detectCouncil,
} from '@/lib/approval/config';
import { VERDICT_META } from '@/lib/approval/engine';

type WD = { L: string; D: string; dua: boolean };

export default function BorangApproval(
  { buildingTypes }: { councils?: { key: string; label: string }[]; buildingTypes?: { key: string; label: string }[] } = {},
) {
  const HOUSES = buildingTypes?.length ? buildingTypes : JENIS_RUMAH_APPROVAL;

  const [poskod, setPoskod] = useState('');
  const [houseType, setHouseType] = useState(HOUSES[0]?.key ?? 'teres');
  const [storeys, setStoreys] = useState(1);
  const [lot, setLot] = useState('intermediate');
  const [works, setWorks] = useState<string[]>(['ext_belakang']);
  const [wd, setWd] = useState<Record<string, WD>>({});
  const [unapproved, setUnapproved] = useState('tak');
  const [boundary, setBoundary] = useState('tak');
  const [ownership, setOwnership] = useState('individu');
  const [startWhen, setStartWhen] = useState('1-3bulan');
  const [nama, setNama] = useState('');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [result, setResult] = useState<SemakResult | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportMsg, setReportMsg] = useState('');

  const det = detectCouncil(poskod);
  const workOptions = JENIS_KERJA.filter((k) => !(lot === 'intermediate' && k.key === 'ext_tepi'));
  const toggleWork = (key: string) =>
    setWorks((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key]));
  const setLotSafe = (v: string) => {
    setLot(v);
    if (v === 'intermediate') setWorks((p) => p.filter((x) => x !== 'ext_tepi'));
  };
  const getWD = (k: string): WD => wd[k] ?? { L: '', D: '', dua: false };
  const setWDField = (k: string, patch: Partial<WD>) =>
    setWd((p) => ({ ...p, [k]: { ...getWD(k), ...patch } }));

  // Balcony memang di tingkat atas — tiada konsep 2 tingkat.
  // Front extension teres 1 tingkat pun tak boleh naik 2 tingkat.
  const canDouble = (k: string) =>
    k !== 'balkoni' && !(k === 'ext_depan' && houseType === 'teres' && storeys === 1);
  const luasOf = (k: string) => {
    const d = getWD(k);
    const base = (Number(d.L) || 0) * (Number(d.D) || 0);
    return canDouble(k) && d.dua ? base * 2 : base;
  };

  async function hantar() {
    if (poskod.trim().length < 5) { setMsg('Sila isi poskod (5 digit).'); return; }
    if (!works.length) { setMsg('Pilih sekurang-kurangnya satu kerja.'); return; }
    if (!telefon.trim()) { setMsg('Sila isi nombor telefon supaya kami boleh hubungi anda.'); return; }
    setBusy(true); setMsg('');

    const work_details: Record<string, any> = {};
    works.forEach((k) => {
      if (!AREA_WORKS.includes(k)) return;
      const d = getWD(k);
      const l = Number(d.L) || 0, dp = Number(d.D) || 0;
      const dua = canDouble(k) && d.dua;
      work_details[k] = { panjang: l, dalam: dp, luas: l * dp, dua_tingkat: dua, luas_total: dua ? l * dp * 2 : l * dp };
    });

    const res = await semakApproval({
      council_code: det.code, poskod: poskod.trim(), house_type: houseType, storeys,
      lot_position: lot, work_types: works, work_details,
      size_ft: null, unapproved, touches_boundary: boundary, ownership, start_when: startWhen,
      nama, telefon, email,
    });
    setBusy(false);
    if (!res.ok) { setMsg(res.error || 'Ralat. Cuba lagi.'); return; }
    setResult(res);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function pilihReport() {
    if (!result?.caseId) return;
    setReportBusy(true); setReportMsg('');
    const r = await mulaBayar(result.caseId);
    if (r.ok && r.url) { window.location.href = r.url; return; }
    setReportBusy(false);
    setReportMsg(r.error || 'Maaf, tak dapat mulakan bayaran sekarang. Cuba lagi atau hubungi kami.');
  }

  // ---------- HASIL ----------
  if (result?.verdict) {
    const m = VERDICT_META[result.verdict];
    return (
      <div className="space-y-4">
        <div className="rounded-2xl p-6 border-2" style={{ backgroundColor: m.bg, borderColor: m.ring }}>
          <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: m.color }}>Keputusan awal</div>
          <div className="text-3xl font-bold mt-1" style={{ color: m.color }}>{m.label}</div>
          <div className="text-[15px] mt-1" style={{ color: m.color }}>{m.tag}</div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-[11px] uppercase tracking-wide text-ink-2 font-bold mb-3">Kenapa keputusan ni</div>
          <ul className="space-y-3">
            {(result.reasons ?? []).map((r, i) => {
              const rm = VERDICT_META[r.level];
              return (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 mt-0.5 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rm.color }} />
                  <span className="text-[14px] text-ink leading-snug">{r.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="text-[12px] text-ink-2 bg-soft rounded-xl p-3.5 leading-relaxed">
          ⓘ Ini <b>indikasi awal sahaja</b>, bukan keputusan rasmi majlis, dan tidak boleh dijadikan asas untuk memulakan kerja binaan. Pengesahan penuh dibuat dalam Laporan Feasibility.
        </div>

        <div className="bg-[#111] text-white rounded-2xl p-5">
          <div className="text-lg font-bold">Dapatkan Laporan Feasibility — RM250</div>
          <div className="text-[13px] text-white/70 mt-1 leading-relaxed">
            Laporan penuh oleh pakar dalam 48 jam: analisis faktor demi faktor, kos &amp; timeline sebenar, senarai dokumen, dan jika perlu — versi yang <b>boleh</b> diluluskan.
          </div>
          <div className="text-[12px] text-white/50 mt-2">RM250 ialah <b>deposit</b> — ditolak sepenuhnya daripada yuran submission jika anda teruskan.</div>
          <button onClick={pilihReport} disabled={reportBusy}
            className="mt-4 bg-brand hover:bg-brand-dark disabled:bg-white/20 text-white text-sm font-semibold px-6 py-3 rounded-full">
            {reportBusy ? 'Menyediakan bayaran…' : 'Bayar RM250 & dapatkan laporan'}
          </button>
          {reportMsg && <div className="text-[13px] text-red-300 mt-3">{reportMsg}</div>}
        </div>

        <button onClick={() => { setResult(null); setReportMsg(''); }}
          className="text-ink-2 text-sm font-semibold hover:text-brand">← Semak rumah lain</button>
      </div>
    );
  }

  // ---------- BORANG ----------
  const card = 'bg-white rounded-2xl p-5 shadow-sm';
  const label = 'block text-sm font-semibold mb-2';
  const input = 'w-full border border-line bg-white rounded-xl px-3.5 py-3 text-[15px] focus:border-brand outline-none';

  const Pills = ({ options, value, set }: { options: { key: any; label: string }[]; value: any; set: (v: any) => void }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={String(o.key)} type="button" onClick={() => set(o.key)}
          className={`text-[13.5px] font-medium px-3.5 py-2.5 rounded-xl border transition-colors ${
            value === o.key ? 'bg-brand text-white border-transparent' : 'bg-white text-ink-2 border-line hover:bg-soft'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* POSKOD */}
      <div className={card}>
        <label className={label}>Poskod rumah anda</label>
        <input className={input} value={poskod} inputMode="numeric" maxLength={5}
          onChange={(e) => setPoskod(e.target.value.replace(/\D/g, ''))} placeholder="cth: 43500" />
        {poskod.length >= 5 && (
          det.code !== 'lain' ? (
            <div className="mt-2">
              <p className="text-[12.5px] text-[#146c37] font-medium">✓ {det.label}</p>
              {!det.core && <p className="text-[12px] text-ink-2 mt-0.5">Kami akan semak peraturan khusus kawasan ini untuk anda.</p>}
            </div>
          ) : (
            <p className="text-[12.5px] text-ink-2 mt-2">Kawasan anda di luar Klang Valley — pasukan kami akan semak secara manual.</p>
          )
        )}
      </div>

      {/* RUMAH */}
      <div className={card}>
        <label className={label}>Jenis rumah</label>
        <Pills options={HOUSES} value={houseType} set={setHouseType} />
        <div className="mt-4"><label className={label}>Bilangan tingkat</label><Pills options={TINGKAT} value={storeys} set={setStoreys} /></div>
        <div className="mt-4"><label className={label}>Kedudukan lot</label><Pills options={KEDUDUKAN_LOT} value={lot} set={setLotSafe} /></div>
      </div>

      {/* KERJA + UKURAN */}
      <div className={card}>
        <label className={label}>Kerja yang anda nak buat <span className="text-ink-2 font-normal text-xs">(boleh pilih lebih satu)</span></label>
        <div className="flex flex-wrap gap-2">
          {workOptions.map((k) => {
            const on = works.includes(k.key);
            return (
              <button key={k.key} type="button" onClick={() => toggleWork(k.key)}
                className={`text-[13.5px] font-medium px-3.5 py-2.5 rounded-xl border transition-colors ${
                  on ? 'bg-brand text-white border-transparent' : 'bg-white text-ink-2 border-line hover:bg-soft'}`}>
                {on ? '✓ ' : ''}{k.label}
              </button>
            );
          })}
        </div>

        {/* Ukuran per kerja */}
        {works.filter((k) => AREA_WORKS.includes(k)).map((k) => {
          const kdef = JENIS_KERJA.find((x) => x.key === k);
          const d = getWD(k);
          const total = luasOf(k);
          return (
            <div key={k} className="mt-4 border border-line rounded-xl p-3.5 bg-soft">
              <div className="text-[13px] font-semibold mb-2.5">{kdef?.label}</div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] text-ink-2 font-semibold mb-1">Panjang (kaki)</label>
                  <input type="number" className="w-full border border-line bg-white rounded-lg px-3 py-2 text-[15px] outline-none focus:border-brand"
                    value={d.L} onChange={(e) => setWDField(k, { L: e.target.value })} placeholder="cth: 20" />
                </div>
                <span className="pb-2.5 text-ink-2">×</span>
                <div className="flex-1">
                  <label className="block text-[11px] text-ink-2 font-semibold mb-1">Dalam (kaki)</label>
                  <input type="number" className="w-full border border-line bg-white rounded-lg px-3 py-2 text-[15px] outline-none focus:border-brand"
                    value={d.D} onChange={(e) => setWDField(k, { D: e.target.value })} placeholder="cth: 12" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                {canDouble(k) ? (
                  <button type="button" onClick={() => setWDField(k, { dua: !d.dua })}
                    className={`text-[12.5px] font-semibold px-3 py-2 rounded-lg border ${
                      d.dua ? 'bg-ink text-white border-transparent' : 'bg-white text-ink-2 border-line'}`}>
                    {d.dua ? '✓ ' : ''}Extension ni 2 tingkat
                  </button>
                ) : k === 'ext_depan' ? (
                  <span className="text-[12px] text-ink-2">Teres 1 tingkat — extension depan tak boleh 2 tingkat</span>
                ) : <span />}
                <span className="text-[13px] font-bold text-ink">{total > 0 ? `${total.toLocaleString('en-MY')} kaki²` : '—'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* BILA MULA */}
      <div className={card}>
        <label className={label}>Bila anda bercadang untuk mula?</label>
        <Pills options={BILA_MULA} value={startWhen} set={setStartWhen} />
      </div>

      {/* MAKLUMAT TAPAK */}
      <div className={card}>
        <div className="text-[11px] uppercase tracking-wide text-ink-2 font-bold mb-3">Beberapa soalan tapak</div>
        <label className={label}>Ada struktur yang sudah dibina tanpa kelulusan?</label>
        <Pills options={YA_TAK_TAKPASTI} value={unapproved} set={setUnapproved} />
        <div className="mt-4"><label className={label}>Kerja menyentuh sempadan / pagar jiran?</label><Pills options={YA_TAK_TAKPASTI} value={boundary} set={setBoundary} /></div>
        <div className="mt-4"><label className={label}>Jenis hakmilik</label><Pills options={HAKMILIK} value={ownership} set={setOwnership} /></div>
      </div>

      {/* CONTACT */}
      <div className={card}>
        <label className={label}>Maklumat untuk kami hubungi anda</label>
        <div className="space-y-3">
          <input className={input} value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama" />
          <input className={input} value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="Nombor telefon (WhatsApp)" />
          <input className={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Emel (pilihan)" />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button onClick={hantar} disabled={busy}
          className="bg-brand hover:bg-brand-dark disabled:bg-line text-white font-semibold px-7 py-3.5 rounded-full shadow">
          {busy ? 'Menyemak…' : 'Semak sekarang — percuma'}
        </button>
        {msg && <span className="text-sm text-brand-dark">{msg}</span>}
      </div>
      <p className="text-[12px] text-ink-2">Tiada pendaftaran. Keputusan keluar serta-merta di skrin.</p>
    </div>
  );
}
