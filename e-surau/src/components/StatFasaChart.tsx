"use client";

import { useState } from "react";

export default function StatFasaChart({
  data, total, tajuk, nota, belumKelas = 0, notaBelumKelas = "",
}: {
  data: { nama: string; bil: number }[];
  total: number;
  tajuk: string;
  nota: string;
  belumKelas?: number;
  notaBelumKelas?: string;
}) {
  // Default: fasa dengan bilangan tertinggi
  const awal = data.reduce((mx, d, i) => (d.bil > (data[mx]?.bil ?? -1) ? i : mx), 0);
  const [idx, setIdx] = useState(awal);
  const pilih = data[idx];
  const max = Math.max(1, ...data.map((d) => d.bil));
  const pct = pilih && pilih.bil ? Math.max((pilih.bil / max) * 100, 4) : 0;

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-xl font-bold text-slate-900">{tajuk}</h2>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-surau">{total}</div>
          <div className="text-xs text-slate-500">jumlah ahli berdaftar</div>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-sm font-medium text-slate-600">Pilih fasa / kawasan</label>
        <select
          value={idx}
          onChange={(e) => setIdx(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-surau"
        >
          {data.map((d, i) => (
            <option key={d.nama} value={i}>{d.nama} — {d.bil} ahli</option>
          ))}
        </select>
      </div>

      {pilih && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <div className="flex items-baseline justify-between">
            <span className="font-semibold text-slate-800">{pilih.nama}</span>
            <span className="text-2xl font-bold text-surau">{pilih.bil}</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-gradient-to-r from-surau to-surau-dark transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {belumKelas > 0 && notaBelumKelas && (
        <p className="mt-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">{belumKelas}</span> {notaBelumKelas}
        </p>
      )}
      <p className="mt-2 text-xs text-slate-400">{nota}</p>
    </section>
  );
}
