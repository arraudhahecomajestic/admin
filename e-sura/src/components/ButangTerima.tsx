"use client";

import { useState, useTransition } from "react";
import { sahkanTerima } from "@/app/pembekal/portal/actions";

// Butang untuk penuntut mengesahkan bayaran telah diterima (auto-isi "Diterima Oleh").
export default function ButangTerima({ tuntutanId }: { tuntutanId: string }) {
  const [pending, start] = useTransition();
  const [ralat, setRalat] = useState("");
  const [buka, setBuka] = useState(false);

  function sahkan() {
    setRalat("");
    start(async () => {
      const r = await sahkanTerima(tuntutanId);
      if (!r.ok) setRalat(r.msg ?? "Gagal mengesahkan.");
    });
  }

  return (
    <div className="mt-3 rounded-lg border border-surau/30 bg-surau/5 p-3 text-sm">
      <div className="font-semibold text-slate-800">Sudah terima bayaran ini?</div>
      <p className="mt-0.5 text-xs text-slate-500">
        Sahkan bahawa anda telah menerima bayaran. Nama &amp; No. KP anda akan diisi automatik pada baucer sebagai bukti penerimaan.
      </p>
      {ralat && <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">{ralat}</div>}
      {!buka ? (
        <button
          onClick={() => setBuka(true)}
          className="mt-2 rounded-lg bg-surau px-4 py-2 text-sm font-semibold text-white hover:bg-surau-dark"
        >
          Sahkan Bayaran Diterima
        </button>
      ) : (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-slate-600">Anda pasti?</span>
          <button
            onClick={sahkan}
            disabled={pending}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            {pending ? "Menyimpan…" : "Ya, saya sahkan terima"}
          </button>
          <button onClick={() => setBuka(false)} className="text-xs text-slate-500 hover:underline">Batal</button>
        </div>
      )}
    </div>
  );
}
