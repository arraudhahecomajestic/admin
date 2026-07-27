"use client";

import { useState } from "react";
import { tambahAhliRingkas } from "@/app/kerani/actions";

export default function KeraniTambah() {
  const [buka, setBuka] = useState(false);
  const [nama, setNama] = useState("");
  const [noKp, setNoKp] = useState("");
  const [emel, setEmel] = useState("");
  const [sedang, setSedang] = useState(false);
  const [hasil, setHasil] = useState<null | { ok: boolean; dup?: boolean; msg: string }>(null);

  async function hantar(e: React.FormEvent) {
    e.preventDefault();
    if (sedang) return;
    setSedang(true);
    setHasil(null);
    const res = await tambahAhliRingkas({ nama, noKp, emel });
    setSedang(false);
    if (res.ok) {
      setHasil({ ok: true, msg: `Berjaya ditambah — No. Ahli ${res.no_ahli ?? "(auto)"}. Ahli boleh log masuk & kemas kini kemudian.` });
      setNama(""); setNoKp(""); setEmel("");
    } else {
      setHasil({ ok: false, dup: res.dup, msg: res.msg ?? "Ralat." });
    }
  }

  return (
    <div className="rounded-xl border-2 border-surau/30 bg-surau/5 p-4">
      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-semibold text-slate-900">➕ Tambah Ahli dari Borang Hardcopy</span>
        <span className="text-sm text-surau">{buka ? "Tutup ▲" : "Buka ▼"}</span>
      </button>

      {buka && (
        <form onSubmit={hantar} className="mt-4 space-y-3">
          <p className="text-xs text-slate-500">
            Untuk ahli yang ada borang hardcopy tetapi belum ada dalam sistem. Isi 3 maklumat asas sahaja —
            ahli akan lengkapkan sendiri masa mereka log masuk & kemas kini.
          </p>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Nama Penuh <span className="text-red-500">*</span></span>
            <input value={nama} onChange={(e) => setNama(e.target.value)} required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase outline-none focus:border-surau" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">No. Kad Pengenalan <span className="text-red-500">*</span></span>
            <input value={noKp} onChange={(e) => setNoKp(e.target.value)} required inputMode="numeric" placeholder="Contoh: 900101015555"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">E-mel <span className="text-slate-400">(jika ada)</span></span>
            <input value={emel} onChange={(e) => setEmel(e.target.value)} type="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau" />
          </label>
          <button disabled={sedang}
            className="rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
            {sedang ? "Menyimpan…" : "Tambah ke Sistem"}
          </button>

          {hasil && (
            <p className={`rounded-lg p-2 text-sm ${hasil.ok ? "bg-green-50 text-green-700" : hasil.dup ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
              {hasil.msg}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
