"use client";

import { useState } from "react";
import { mulaBayaranKhairat } from "@/app/ahli/khairat/actions";
import { PAKEJ_KHAIRAT, YURAN_KHAIRAT_TAHUNAN } from "@/lib/tetapan";

export default function BayarKhairatButton() {
  const [sedang, setSedang] = useState<number | null>(null);
  const [ralat, setRalat] = useState("");

  async function bayar(tahun: number) {
    setRalat("");
    setSedang(tahun);
    const res = await mulaBayaranKhairat(tahun);
    if (!res.ok) { setSedang(null); setRalat(res.msg ?? "Ralat pembayaran."); return; }
    if (res.checkout_url) window.location.href = res.checkout_url;
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-700">Pilih pakej & bayar (online):</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PAKEJ_KHAIRAT.map((pk) => {
          const jum = YURAN_KHAIRAT_TAHUNAN * pk.tahun;
          return (
            <button
              key={pk.tahun}
              type="button"
              onClick={() => bayar(pk.tahun)}
              disabled={sedang !== null}
              className="rounded-lg border-2 border-surau/30 bg-white p-3 text-center hover:border-surau disabled:opacity-60"
            >
              <div className="text-sm font-bold text-slate-900">{pk.label}</div>
              <div className="mt-0.5 text-surau font-semibold">RM{jum}</div>
              {sedang === pk.tahun && <div className="mt-1 text-[11px] text-amber-600">Menyambung…</div>}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">Yuran RM{YURAN_KHAIRAT_TAHUNAN}/tahun. Bayar terus untuk beberapa tahun sekali gus (FPX/kad/e-wallet).</p>
      {ralat && <p className="text-sm text-red-600">{ralat}</p>}
    </div>
  );
}
