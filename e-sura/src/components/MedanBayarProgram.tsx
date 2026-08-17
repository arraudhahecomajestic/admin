"use client";

import { useState } from "react";

// Kotak "Program berbayar" + medan Yuran & Rujukan bayaran.
// Medan bayaran hanya muncul apabila "Program berbayar" ditanda —
// program percuma tak nampak apa-apa bab bayaran.
export default function MedanBayarProgram({
  defaultBerbayar = false,
  defaultYuran = "",
  defaultRuj = "",
}: {
  defaultBerbayar?: boolean;
  defaultYuran?: string | number;
  defaultRuj?: string;
}) {
  const [berbayar, setBerbayar] = useState(defaultBerbayar);
  return (
    <div className="space-y-3 sm:col-span-2">
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" name="berbayar" checked={berbayar} onChange={(e) => setBerbayar(e.target.checked)} />
        Program berbayar (borang pendaftaran + bayar manual/upload resit; auto CHIP bila go live)
      </label>
      {berbayar && (
        <div className="grid gap-3 rounded-lg border border-surau/20 bg-surau/5 p-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Yuran seorang (RM)</span>
            <input name="yuran" type="number" min="0" step="0.01" defaultValue={defaultYuran} placeholder="cth: 30" className="inp" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Rujukan bayaran (untuk pindahan)</span>
            <input name="ruj_bayar" defaultValue={defaultRuj} placeholder="cth: Program Memanah SAR2026" className="inp" />
          </label>
        </div>
      )}
    </div>
  );
}
