"use client";

import { useState } from "react";
import { seedAkaunAhli } from "@/app/admin/seed-akaun/actions";

export default function SeedRunner() {
  const [jalan, setJalan] = useState(false);
  const [siap, setSiap] = useState(false);
  const [total, setTotal] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dicipta, setDicipta] = useState(0);
  const [wujud, setWujud] = useState(0);
  const [gagal, setGagal] = useState(0);
  const [ralat, setRalat] = useState("");

  async function mula() {
    setJalan(true);
    setRalat("");
    setSiap(false);
    let offset = 0;
    let c = 0,
      w = 0,
      g = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const res = await seedAkaunAhli(offset);
      if (!res.ok) {
        setRalat(res.msg ?? "Ralat.");
        setJalan(false);
        return;
      }
      c += res.created ?? 0;
      w += res.existing ?? 0;
      g += res.failed ?? 0;
      setTotal(res.total ?? 0);
      setProgress(res.next ?? 0);
      setDicipta(c);
      setWujud(w);
      setGagal(g);
      if (res.done) break;
      offset = res.next ?? offset;
    }
    setJalan(false);
    setSiap(true);
  }

  const pct = total ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {!jalan && !siap && (
        <button
          onClick={mula}
          className="rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark"
        >
          Mula Sediakan Akaun →
        </button>
      )}

      {(jalan || siap) && (
        <div className="space-y-3">
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full bg-surau transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-sm text-slate-600">
            {progress} / {total} diproses ({pct}%)
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-green-50 p-3">
              <div className="text-xl font-bold text-green-700">{dicipta}</div>
              <div className="text-xs text-slate-500">Dicipta</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-xl font-bold text-slate-600">{wujud}</div>
              <div className="text-xs text-slate-500">Sudah wujud</div>
            </div>
            <div className="rounded-lg bg-red-50 p-3">
              <div className="text-xl font-bold text-red-600">{gagal}</div>
              <div className="text-xs text-slate-500">Gagal</div>
            </div>
          </div>
        </div>
      )}

      {jalan && <div className="text-sm text-amber-600">Sedang berjalan… jangan tutup halaman ini.</div>}
      {siap && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          ✓ Selesai! {dicipta} akaun baharu dicipta, {wujud} sudah sedia ada.
          {gagal > 0 && ` ${gagal} gagal (biasanya emel tak sah).`}
        </div>
      )}
      {ralat && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{ralat}</div>
      )}
    </div>
  );
}
