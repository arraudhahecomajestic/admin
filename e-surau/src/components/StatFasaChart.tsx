"use client";

import { useState } from "react";

export default function StatFasaChart({
  data, total, tajuk, nota, belumKelas = 0, notaBelumKelas = "", labelLihat, labelTutup,
}: {
  data: { nama: string; bil: number }[];
  total: number;
  tajuk: string;
  nota: string;
  belumKelas?: number;
  notaBelumKelas?: string;
  labelLihat: string;
  labelTutup: string;
}) {
  const [buka, setBuka] = useState(false);
  const max = Math.max(1, ...data.map((d) => d.bil));

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">{tajuk}</h2>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-extrabold text-surau">{total}</div>
            <div className="text-xs text-slate-500">jumlah ahli berdaftar</div>
          </div>
          <button
            onClick={() => setBuka((v) => !v)}
            className="rounded-lg border border-surau/40 px-4 py-2 text-sm font-semibold text-surau hover:bg-surau/5"
          >
            {buka ? labelTutup : labelLihat}
          </button>
        </div>
      </div>

      {buka && (
        <>
          <div className="mt-5 space-y-2.5">
            {data.map((d) => {
              const pct = d.bil ? Math.max((d.bil / max) * 100, 5) : 0;
              return (
                <div key={d.nama} className="flex items-center gap-3">
                  <div className="w-28 shrink-0 text-sm font-medium text-slate-700 sm:w-32">{d.nama}</div>
                  <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-slate-100">
                    <div className="flex h-full items-center justify-end rounded-md bg-gradient-to-r from-surau to-surau-dark pr-2 transition-all" style={{ width: `${pct}%` }}>
                      {d.bil > 0 && pct > 18 && <span className="text-xs font-bold text-white">{d.bil}</span>}
                    </div>
                    {(d.bil === 0 || pct <= 18) && (
                      <span className="absolute inset-y-0 right-2 flex items-center text-xs font-bold text-slate-500">{d.bil}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {belumKelas > 0 && notaBelumKelas && (
            <p className="mt-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-600">{belumKelas}</span> {notaBelumKelas}
            </p>
          )}
        </>
      )}

      <p className="mt-3 text-xs text-slate-400">{nota}</p>
    </section>
  );
}
