"use client";

import { useState } from "react";
import { rm, tarikhMs } from "@/lib/format";

export default function KadDanaTutup({
  nama, terkumpul, tarikh, labelLihat, labelTutup, labelSehingga,
}: {
  nama: string;
  terkumpul: number | string;
  tarikh: string | null;
  labelLihat: string;
  labelTutup: string;
  labelSehingga: string;
}) {
  const [buka, setBuka] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">{nama}</h3>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">{labelTutup}</span>
      </div>
      {!buka ? (
        <button
          onClick={() => setBuka(true)}
          className="mt-4 w-full rounded-lg border border-surau/40 bg-white px-4 py-2.5 text-sm font-semibold text-surau hover:bg-surau/5"
        >
          {labelLihat}
        </button>
      ) : (
        <div className="mt-4 rounded-lg bg-white p-4 text-center">
          <div className="text-2xl font-bold text-surau">{rm(terkumpul)}</div>
          <div className="mt-1 text-xs text-slate-500">
            {labelSehingga} {tarikh ? tarikhMs(tarikh) : "—"}
          </div>
        </div>
      )}
    </div>
  );
}
