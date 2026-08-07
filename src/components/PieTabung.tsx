"use client";

import { useState } from "react";
import { rm, tarikhMs } from "@/lib/format";

export type PieSlice = {
  nama: string;
  jumlah: number; // kutipan Jan–Jun 2026 (untuk saiz slice)
  jenisKhairat?: boolean;
  ditutup?: boolean;
  bulanIni?: number | string;
  terkumpul?: number | string;
  terkiniJumlah?: number | string | null;
  terkiniTarikh?: string | null;
};

// Palet warna surau — emas & tona hangat + neutral supaya slice mudah dibeza
const WARNA = [
  "#b8860b", // surau gold
  "#0f766e", // teal
  "#b45309", // amber-700
  "#7c3aed", // violet
  "#c2410c", // orange-700
  "#15803d", // green-700
  "#0369a1", // sky-700
  "#a21caf", // fuchsia
  "#4b5563", // slate-600
];

function polarToXY(cx: number, cy: number, r: number, sudut: number) {
  const rad = (sudut - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, mula: number, tamat: number) {
  // Bulatan penuh (satu slice sahaja)
  if (tamat - mula >= 359.999) {
    const a = polarToXY(cx, cy, r, mula);
    const t = polarToXY(cx, cy, r, mula + 179.999);
    return `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 1 1 ${t.x} ${t.y} A ${r} ${r} 0 1 1 ${a.x} ${a.y} Z`;
  }
  const p1 = polarToXY(cx, cy, r, mula);
  const p2 = polarToXY(cx, cy, r, tamat);
  const besar = tamat - mula > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${besar} 1 ${p2.x} ${p2.y} Z`;
}

export default function PieTabung({
  data,
  lang,
  tajuk,
  tempoh,
  nota,
  labelJumlah,
  labelKlik,
}: {
  data: PieSlice[];
  lang: string;
  tajuk: string;
  tempoh?: string;
  nota: string;
  labelJumlah: string;
  labelKlik: string;
}) {
  const t = (ms: string, en: string) => (lang === "en" ? en : ms);
  const senarai = data.filter((d) => d.jumlah > 0).sort((a, b) => b.jumlah - a.jumlah);
  const total = senarai.reduce((s, d) => s + d.jumlah, 0);
  const [pilih, setPilih] = useState<number | null>(null);

  if (senarai.length === 0 || total <= 0) return null;

  const cx = 100, cy = 100, r = 90;
  let sudut = 0;
  const slices = senarai.map((d, i) => {
    const bahagian = (d.jumlah / total) * 360;
    const mid = sudut + bahagian / 2;
    const seg = { d, i, mula: sudut, tamat: sudut + bahagian, mid, warna: WARNA[i % WARNA.length] };
    sudut += bahagian;
    return seg;
  });

  const aktif = pilih != null ? senarai[pilih] : null;
  const peratusAktif = aktif ? (aktif.jumlah / total) * 100 : 0;

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">{tajuk}</h2>
      {tempoh && <p className="mt-0.5 text-sm font-medium text-slate-500">{tempoh}</p>}
      <p className="mb-4 mt-1 text-xs text-slate-400">{labelKlik}</p>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        {/* Carta bulat */}
        <div className="relative shrink-0">
          <svg viewBox="0 0 200 200" className="h-60 w-60">
            {slices.map((s) => {
              const dipilih = pilih === s.i;
              // "Blow up" — tolak slice yang dipilih keluar sedikit ikut sudut tengah
              const off = dipilih ? polarToXY(0, 0, 8, s.mid) : { x: 0, y: 0 };
              return (
                <path
                  key={s.i}
                  d={arcPath(cx, cy, dipilih ? r + 4 : r, s.mula, s.tamat)}
                  transform={`translate(${off.x} ${off.y})`}
                  fill={s.warna}
                  stroke="#fff"
                  strokeWidth={2}
                  className="cursor-pointer transition-opacity"
                  style={{ opacity: pilih == null || dipilih ? 1 : 0.3 }}
                  onClick={() => setPilih((p) => (p === s.i ? null : s.i))}
                />
              );
            })}
            {/* Bulatan tengah — donut */}
            <circle cx={cx} cy={cy} r={44} fill="#fff" />
            <text x={cx} y={cy - 6} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 9 }}>
              {aktif ? aktif.nama : labelJumlah}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" className="fill-slate-900" style={{ fontSize: 14, fontWeight: 700 }}>
              {rm(aktif ? aktif.jumlah : total)}
            </text>
            {aktif && (
              <text x={cx} y={cy + 26} textAnchor="middle" className="fill-surau" style={{ fontSize: 9, fontWeight: 600 }}>
                {peratusAktif.toFixed(1)}%
              </text>
            )}
          </svg>
        </div>

        {/* Legenda / pecahan */}
        <div className="w-full flex-1 space-y-1.5">
          {slices.map((s) => {
            const peratus = (s.d.jumlah / total) * 100;
            const dipilih = pilih === s.i;
            return (
              <button
                key={s.i}
                onClick={() => setPilih((p) => (p === s.i ? null : s.i))}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                  dipilih ? "bg-surau/10 ring-1 ring-surau/40" : "hover:bg-slate-50"
                }`}
              >
                <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: s.warna }} />
                <span className="flex-1 truncate text-sm font-medium text-slate-700">{s.d.nama}</span>
                <span className="text-sm font-semibold text-slate-900">{rm(s.d.jumlah)}</span>
                <span className="w-12 shrink-0 text-right text-xs text-slate-400">{peratus.toFixed(1)}%</span>
              </button>
            );
          })}
          <div className="mt-1 flex items-center justify-between border-t px-3 pt-2">
            <span className="text-sm font-bold text-slate-900">{labelJumlah}</span>
            <span className="text-sm font-extrabold text-surau">{rm(total)}</span>
          </div>
        </div>
      </div>

      {/* Panel "blow up" — detail tabung yang diklik */}
      {aktif && (
        <div className="mt-5 rounded-xl border-2 border-surau/30 bg-surau/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{aktif.nama}</h3>
              {aktif.jenisKhairat && !aktif.ditutup && (
                <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">{t("Khairat", "Death Benefit")}</span>
              )}
              {aktif.ditutup && (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">{t("Ditutup", "Closed")}</span>
              )}
            </div>
            <button onClick={() => setPilih(null)} className="text-xs font-medium text-slate-400 hover:text-slate-600">
              {t("Tutup", "Close")} ✕
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <div className="text-lg font-extrabold text-surau">{rm(aktif.jumlah)}</div>
              <div className="text-xs text-slate-500">{t("Kutipan Jan–Jun 2026", "Collection Jan–Jun 2026")}</div>
            </div>
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <div className="text-lg font-bold text-slate-800">{peratusAktif.toFixed(1)}%</div>
              <div className="text-xs text-slate-500">{t("Daripada jumlah", "Of total")}</div>
            </div>
            {aktif.bulanIni != null && (
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <div className="text-lg font-bold text-slate-800">{rm(aktif.bulanIni)}</div>
                <div className="text-xs text-slate-500">{t("Bulan ini", "This month")}</div>
              </div>
            )}
            {aktif.terkumpul != null && (
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <div className="text-lg font-bold text-slate-800">{rm(aktif.terkumpul)}</div>
                <div className="text-xs text-slate-500">{t("Terkumpul (semua)", "Total (all-time)")}</div>
              </div>
            )}
          </div>

          <div className="mt-2 text-xs text-slate-500">
            {t("Kutipan terkini", "Latest collection")}
            {aktif.terkiniTarikh
              ? ` · ${tarikhMs(aktif.terkiniTarikh)}${aktif.terkiniJumlah != null ? ` · ${rm(aktif.terkiniJumlah)}` : ""}`
              : ` · ${t("belum ada rekod", "no records yet")}`}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">{nota}</p>
    </section>
  );
}
