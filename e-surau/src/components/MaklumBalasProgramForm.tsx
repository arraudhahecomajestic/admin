"use client";

import { useState } from "react";
import { hantarMaklumBalasProgram } from "@/app/program/actions";

export default function MaklumBalasProgramForm({ programId }: { programId: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [apaBaik, setApaBaik] = useState("");
  const [cadangan, setCadangan] = useState("");
  const [nama, setNama] = useState("");
  const [busy, setBusy] = useState(false);
  const [selesai, setSelesai] = useState<null | { ok: boolean; msg: string }>(null);

  async function hantar() {
    if (rating < 1) { setSelesai({ ok: false, msg: "Sila pilih penilaian bintang dahulu." }); return; }
    setBusy(true); setSelesai(null);
    const res = await hantarMaklumBalasProgram({ program_id: programId, rating, apa_baik: apaBaik, cadangan, nama });
    setBusy(false);
    if (!res.ok) { setSelesai({ ok: false, msg: res.msg ?? "Ralat." }); return; }
    setSelesai({ ok: true, msg: "" });
  }

  if (selesai?.ok) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">✓</div>
        <h2 className="text-xl font-bold text-slate-900">Terima kasih!</h2>
        <p className="mt-2 text-slate-600">Maklum balas anda telah dihantar. Pandangan anda membantu kami menambah baik program surau, insyaAllah.</p>
      </div>
    );
  }

  const label = ["", "Kurang memuaskan", "Boleh diperbaiki", "Memuaskan", "Baik", "Sangat baik"][hover || rating] || "";

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      {selesai && !selesai.ok && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{selesai.msg}</div>}
      <div className="space-y-5">
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Penilaian Keseluruhan *</span>
          <div className="flex items-center gap-1.5" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                aria-label={`${n} bintang`}
                className={`text-3xl leading-none transition ${(hover || rating) >= n ? "text-amber-400" : "text-slate-300"}`}
              >
                ★
              </button>
            ))}
            <span className="ml-2 text-sm text-slate-500">{label}</span>
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Apa yang baik? <span className="text-slate-400">(pilihan)</span></span>
          <textarea value={apaBaik} onChange={(e) => setApaBaik(e.target.value)} rows={3} placeholder="Apa yang anda suka tentang program ini…" className="inp" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Cadangan penambahbaikan? <span className="text-slate-400">(pilihan)</span></span>
          <textarea value={cadangan} onChange={(e) => setCadangan(e.target.value)} rows={3} placeholder="Apa yang boleh kami perbaiki untuk program akan datang…" className="inp" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Nama <span className="text-slate-400">(pilihan)</span></span>
          <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Boleh tanpa nama" className="inp" />
        </label>

        <button onClick={hantar} disabled={busy} className="w-full rounded-lg bg-surau px-5 py-3 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
          {busy ? "Menghantar…" : "Hantar Maklum Balas"}
        </button>
      </div>
      <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </div>
  );
}
