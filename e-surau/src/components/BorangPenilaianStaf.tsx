"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BAHAGIAN_PENILAIAN, subtotalBahagian, markahAkhir, gredDari, KEPUTUSAN_LABEL } from "@/lib/penilaian";
import { simpanPenilaian } from "@/app/admin/staf/penilaian/actions";

export default function BorangPenilaianStaf({
  profilId, nama, noKp, jawatan, gajiSemasa, tempohLalai,
}: { profilId: string; nama: string; noKp?: string; jawatan?: string; gajiSemasa?: number; tempohLalai?: string }) {
  const router = useRouter();
  const [markah, setMarkah] = useState<Record<string, number>>({});
  const [tempoh, setTempoh] = useState(tempohLalai ?? "");
  const [keputusan, setKeputusan] = useState("");
  const [kekuatan, setKekuatan] = useState("");
  const [penambahbaikan, setPenambahbaikan] = useState("");
  const [ulasanAm, setUlasanAm] = useState("");
  const [gajiCadangan, setGajiCadangan] = useState("2500");
  const [hantar, setHantar] = useState(false);
  const [ralat, setRalat] = useState("");

  const set = (no: number, max: number, v: string) => {
    let n = Number(v);
    if (isNaN(n)) n = 0;
    n = Math.max(0, Math.min(max, n));
    setMarkah((s) => ({ ...s, [String(no)]: n }));
  };

  const pct = markahAkhir(markah);
  const g = gredDari(pct);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setRalat("");
    if (!keputusan) { setRalat("Sila pilih keputusan penilaian."); return; }
    setHantar(true);
    const res = await simpanPenilaian({
      profil_id: profilId, nama, no_kp: noKp, jawatan, tempoh,
      tarikh_penilaian: new Date().toISOString().slice(0, 10),
      markah, keputusan,
      gaji_semasa: gajiSemasa, gaji_cadangan: gajiCadangan,
      kekuatan, penambahbaikan, ulasan_am: ulasanAm,
    });
    setHantar(false);
    if (!res.ok) { setRalat(res.msg ?? "Ralat menyimpan."); return; }
    router.push("/admin/staf/penilaian");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="text-lg font-bold text-slate-900">{nama}</div>
        <div className="text-sm text-slate-500">{jawatan}{noKp ? ` · ${noKp}` : ""}</div>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Tempoh / tujuan penilaian</span>
          <input value={tempoh} onChange={(e) => setTempoh(e.target.value)} placeholder="cth: Penilaian Percubaan (17 Feb – 16 Mei 2026)" className="inp" />
        </label>
      </div>

      {BAHAGIAN_PENILAIAN.map((b) => {
        const sub = subtotalBahagian(b, markah);
        return (
          <div key={b.kod} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-surau-dark">{b.kod}. {b.tajuk} <span className="text-xs font-normal text-slate-400">· Wajaran {Math.round(b.wajaran * 100)}%</span></h3>
              <span className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{sub} / 100</span>
            </div>
            <div className="space-y-3">
              {b.items.map((it) => (
                <div key={it.no} className="flex flex-wrap items-start gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex-1 min-w-[220px]">
                    <div className="text-sm font-medium text-slate-800">{it.no}. {it.tajuk}</div>
                    <div className="text-xs text-slate-500">{it.indikator}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <input type="number" min={0} max={it.max} value={markah[String(it.no)] ?? ""} onChange={(e) => set(it.no, it.max, e.target.value)} className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-right text-sm" />
                    <span className="text-sm text-slate-400">/ {it.max}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Keputusan & markah */}
      <div className="rounded-xl border-2 border-surau/30 bg-surau/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-slate-500">Markah Akhir Berwajaran</div>
            <div className="text-3xl font-bold text-surau-dark">{pct.toFixed(2)}%</div>
          </div>
          <div className="text-right">
            <span className={`rounded px-3 py-1 text-sm font-bold ${g.cls}`}>{g.gred}</span>
            <div className="mt-1 text-xs text-slate-500">{g.ganjaran}</div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Keputusan *</span>
            <select value={keputusan} onChange={(e) => setKeputusan(e.target.value)} className="inp">
              <option value="">— Pilih —</option>
              {Object.entries(KEPUTUSAN_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Cadangan gaji (jika lulus)</span>
            <input type="number" min="0" step="0.01" value={gajiCadangan} onChange={(e) => setGajiCadangan(e.target.value)} className="inp" />
            {gajiSemasa != null && <span className="mt-1 block text-[11px] text-slate-400">Gaji semasa: RM{Number(gajiSemasa).toFixed(2)}</span>}
          </label>
        </div>
      </div>

      {/* Ulasan penyelia */}
      <div className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
        <label className="block"><span className="mb-1 block text-xs font-medium text-slate-600">Kekuatan utama</span>
          <textarea rows={2} value={kekuatan} onChange={(e) => setKekuatan(e.target.value)} className="inp" /></label>
        <label className="block"><span className="mb-1 block text-xs font-medium text-slate-600">Bidang penambahbaikan</span>
          <textarea rows={2} value={penambahbaikan} onChange={(e) => setPenambahbaikan(e.target.value)} className="inp" /></label>
        <label className="block"><span className="mb-1 block text-xs font-medium text-slate-600">Ulasan am penyelia</span>
          <textarea rows={2} value={ulasanAm} onChange={(e) => setUlasanAm(e.target.value)} className="inp" /></label>
      </div>

      {ralat && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{ralat}</div>}
      <div className="flex gap-3">
        <button type="submit" disabled={hantar} className="rounded-lg bg-surau px-6 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
          {hantar ? "Menyimpan…" : "Simpan Penilaian"}
        </button>
      </div>

      <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </form>
  );
}
