"use client";

import { useState } from "react";
import { hantarMaklumBalas } from "@/app/maklum-balas/actions";

const JENIS = [
  { v: "komplen", t: "Komplen / Aduan" },
  { v: "cadangan", t: "Cadangan Penambahbaikan" },
  { v: "pertanyaan", t: "Pertanyaan" },
  { v: "lain", t: "Lain-lain" },
];

export default function MaklumBalasForm() {
  const [jenis, setJenis] = useState("cadangan");
  const [nama, setNama] = useState("");
  const [hubungan, setHubungan] = useState("");
  const [mesej, setMesej] = useState("");
  const [busy, setBusy] = useState(false);
  const [selesai, setSelesai] = useState<null | { ok: boolean; msg: string }>(null);

  async function hantar() {
    setBusy(true); setSelesai(null);
    const res = await hantarMaklumBalas({ jenis, nama, hubungan, mesej });
    setBusy(false);
    if (!res.ok) { setSelesai({ ok: false, msg: res.msg ?? "Ralat." }); return; }
    setSelesai({ ok: true, msg: "" });
  }

  if (selesai?.ok) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
        <h2 className="text-xl font-bold text-slate-900">Terima kasih!</h2>
        <p className="mt-2 text-slate-600">Maklum balas anda telah dihantar kepada AJK Surau Ar Raudhah. Setiap pandangan amat kami hargai. </p>
        <button onClick={() => { setSelesai(null); setMesej(""); setNama(""); setHubungan(""); }} className="mt-5 rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark">Hantar lagi</button>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      {selesai && !selesai.ok && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{selesai.msg}</div>}
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Jenis Maklum Balas</span>
          <select value={jenis} onChange={(e) => setJenis(e.target.value)} className="inp">
            {JENIS.map((j) => <option key={j.v} value={j.v}>{j.t}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Maklum Balas / Cadangan *</span>
          <textarea value={mesej} onChange={(e) => setMesej(e.target.value)} rows={5} placeholder="Tuliskan komplen, cadangan atau pandangan anda untuk penambahbaikan surau…" className="inp" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Nama <span className="text-slate-400">(pilihan)</span></span>
            <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Boleh tanpa nama" className="inp" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">No. Telefon / E-mel <span className="text-slate-400">(pilihan)</span></span>
            <input value={hubungan} onChange={(e) => setHubungan(e.target.value)} placeholder="Jika mahu kami hubungi balik" className="inp" />
          </label>
        </div>
        <button onClick={hantar} disabled={busy} className="w-full rounded-lg bg-surau px-6 py-3 font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
          {busy ? "Menghantar…" : "Hantar Maklum Balas"}
        </button>
        <p className="text-center text-xs text-slate-400">Maklum balas anda dihantar terus kepada AJK surau secara sulit.</p>
      </div>
      <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </div>
  );
}
