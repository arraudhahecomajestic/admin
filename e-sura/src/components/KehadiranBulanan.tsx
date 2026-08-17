"use client";

import { useState } from "react";
import { ambilKehadiranBulan } from "@/app/admin/staf/actions";

type Row = { tarikh: string; shift: string; masuk?: string | null; keluar?: string | null; catatan?: string | null };
type Data = { bulan: string; jadual: Row[]; kehadiran: Row[] };

const HARI = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
const BULAN = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];

function labelShift(k?: string | null) {
  return k === "pagi" ? "Pagi" : k === "petang" ? "Petang" : k === "rehat" ? "Rehat" : k === "cuti" ? "Cuti" : "—";
}
function jam(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" });
}
function todayKL() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
}

export default function KehadiranBulanan({ awal }: { awal: Data }) {
  const [bulan, setBulan] = useState(awal.bulan);
  const [jadual, setJadual] = useState<Row[]>(awal.jadual);
  const [kehadiran, setKehadiran] = useState<Row[]>(awal.kehadiran);
  const [busy, setBusy] = useState(false);

  async function tukar(b: string) {
    setBulan(b); setBusy(true);
    const res = await ambilKehadiranBulan(b);
    setBusy(false);
    if (res.ok) { setJadual(res.jadual); setKehadiran(res.kehadiran); }
  }

  const [thn, bln] = bulan.split("-").map(Number);
  const akhir = new Date(thn, bln, 0).getDate();
  const hari0 = todayKL();

  const jMap = new Map(jadual.map((r) => [r.tarikh, r]));
  const kMap = new Map<string, Row[]>();
  for (const r of kehadiran) {
    const a = kMap.get(r.tarikh) ?? []; a.push(r); kMap.set(r.tarikh, a);
  }

  let nHadir = 0, nCuti = 0, nTidak = 0, jamKerja = 0;
  const baris = [] as any[];
  for (let d = 1; d <= akhir; d++) {
    const t = `${bulan}-${String(d).padStart(2, "0")}`;
    const wd = new Date(thn, bln - 1, d).getDay();
    const j = jMap.get(t);
    const ks = kMap.get(t) ?? [];
    const adaMasuk = ks.some((k) => k.masuk);
    let status = "—", cls = "text-slate-400";
    if (j?.shift === "cuti") { status = "Cuti"; cls = "text-red-600"; nCuti++; }
    else if (adaMasuk) { status = "Hadir"; cls = "text-green-700"; nHadir++; }
    else if (j?.shift === "rehat") { status = "Rehat"; cls = "text-slate-500"; }
    else if ((j?.shift === "pagi" || j?.shift === "petang") && t < hari0) { status = "Tidak Hadir"; cls = "text-red-600 font-semibold"; nTidak++; }
    else if (t === hari0) { status = "Hari ini"; cls = "text-surau"; }

    for (const k of ks) if (k.masuk && k.keluar) jamKerja += (new Date(k.keluar).getTime() - new Date(k.masuk).getTime()) / 3600000;

    const masaTeks = ks.filter((k) => k.masuk).map((k) => `${jam(k.masuk)}${k.keluar ? "–" + jam(k.keluar) : " (blm keluar)"}`).join(", ");
    baris.push({ d, wd, t, jadual: j?.shift, status, cls, masaTeks, hujung: wd === 0 || wd === 6 });
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-slate-900">Kehadiran &amp; Jadual Bulanan</h2>
          <p className="text-sm text-slate-500">Semak jadual kerja, hari cuti &amp; rekod kedatangan staf mengikut bulan.</p>
        </div>
        <input type="month" value={bulan} onChange={(e) => tukar(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>

      {/* Ringkasan */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[["Hadir", nHadir, "text-green-700"], ["Cuti", nCuti, "text-red-600"], ["Tidak Hadir", nTidak, "text-red-600"], ["Jumlah Jam", Math.round(jamKerja), "text-slate-900"]].map(([lab, val, cls]) => (
          <div key={lab as string} className="rounded-lg bg-slate-50 p-3 text-center">
            <div className={`text-2xl font-bold ${cls}`}>{val as number}</div>
            <div className="text-xs text-slate-500">{lab as string}</div>
          </div>
        ))}
      </div>

      {busy && <p className="mb-2 text-sm text-slate-400">Memuatkan…</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-slate-500">
              <th className="py-2 pr-2">Tarikh</th>
              <th className="py-2 pr-2">Hari</th>
              <th className="py-2 pr-2">Jadual</th>
              <th className="py-2 pr-2">Masa (masuk–keluar)</th>
              <th className="py-2 pr-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {baris.map((r) => (
              <tr key={r.d} className={`border-b border-slate-100 ${r.hujung ? "bg-slate-50/60" : ""}`}>
                <td className="py-1.5 pr-2 font-medium text-slate-700">{r.d}/{bln}</td>
                <td className="py-1.5 pr-2 text-slate-600">{HARI[r.wd]}</td>
                <td className="py-1.5 pr-2 text-slate-600">{labelShift(r.jadual)}</td>
                <td className="py-1.5 pr-2 text-slate-600">{r.masaTeks || "—"}</td>
                <td className={`py-1.5 pr-2 ${r.cls}`}>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">Nota: "Tidak Hadir" hanya ditandakan untuk hari kerja yang telah berlalu tanpa rekod masuk. Hari cuti diambil dari jadual kerja.</p>
    </section>
  );
}
