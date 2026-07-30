"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { tambahPengumuman, simpanPengumuman, padamPengumuman } from "@/app/admin/pengumuman/actions";
import { tarikhMs } from "@/lib/format";

type P = { id: string; tajuk: string; kandungan: string; penting: boolean; diterbitkan: boolean; tarikh: string };

export default function PengumumanAdmin({ senarai }: { senarai: P[] }) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <Borang onDone={() => router.refresh()} />
      <section className="rounded-xl bg-white shadow-sm">
        <h2 className="border-b px-5 py-3 font-semibold text-slate-900">Senarai Pengumuman ({senarai.length})</h2>
        <div className="divide-y divide-slate-100">
          {senarai.length === 0 && <p className="px-5 py-6 text-center text-slate-400">Tiada pengumuman lagi.</p>}
          {senarai.map((p) => <Baris key={p.id} p={p} onDone={() => router.refresh()} />)}
        </div>
      </section>
      <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </div>
  );
}

function Borang({ onDone }: { onDone: () => void }) {
  const [tajuk, setTajuk] = useState("");
  const [kandungan, setKandungan] = useState("");
  const [penting, setPenting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function hantar() {
    setBusy(true); setMsg("");
    const res = await tambahPengumuman({ tajuk, kandungan, penting });
    setBusy(false);
    if (!res.ok) { setMsg(res.msg ?? "Ralat."); return; }
    setTajuk(""); setKandungan(""); setPenting(false); setMsg("✓ Pengumuman diterbitkan.");
    onDone();
  }
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 font-semibold text-slate-900">Pengumuman Baru</h2>
      <div className="space-y-2">
        <input value={tajuk} onChange={(e) => setTajuk(e.target.value)} placeholder="Tajuk pengumuman" className="inp" />
        <textarea value={kandungan} onChange={(e) => setKandungan(e.target.value)} rows={3} placeholder="Kandungan…" className="inp" />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={penting} onChange={(e) => setPenting(e.target.checked)} className="h-4 w-4 accent-surau" />
          Tanda sebagai <b>Penting</b> (jalur kuning)
        </label>
        <div className="flex items-center gap-3">
          <button onClick={hantar} disabled={busy} className="rounded-lg bg-surau px-5 py-2 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">{busy ? "…" : "Terbit Pengumuman"}</button>
          {msg && <span className={`text-sm ${msg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{msg}</span>}
        </div>
      </div>
    </section>
  );
}

function Baris({ p, onDone }: { p: P; onDone: () => void }) {
  const [edit, setEdit] = useState(false);
  const [tajuk, setTajuk] = useState(p.tajuk);
  const [kandungan, setKandungan] = useState(p.kandungan);
  const [penting, setPenting] = useState(p.penting);
  const [busy, setBusy] = useState(false);

  async function simpan() {
    setBusy(true);
    await simpanPengumuman(p.id, { tajuk, kandungan, penting });
    setBusy(false); setEdit(false); onDone();
  }

  if (edit) {
    return (
      <div className="space-y-2 bg-slate-50 px-5 py-4">
        <input value={tajuk} onChange={(e) => setTajuk(e.target.value)} className="inp" />
        <textarea value={kandungan} onChange={(e) => setKandungan(e.target.value)} rows={3} className="inp" />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={penting} onChange={(e) => setPenting(e.target.checked)} className="h-4 w-4 accent-surau" /> Penting
        </label>
        <div className="flex items-center gap-3">
          <button onClick={simpan} disabled={busy} className="rounded-lg bg-surau px-4 py-1.5 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">{busy ? "…" : "Simpan"}</button>
          <button onClick={() => { setTajuk(p.tajuk); setKandungan(p.kandungan); setPenting(p.penting); setEdit(false); }} className="text-sm text-slate-500">Batal</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 px-5 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-slate-900">{p.tajuk}</span>
          {p.penting && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">Penting</span>}
          {!p.diterbitkan && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">Tersorok</span>}
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{p.kandungan}</p>
        <div className="mt-0.5 text-xs text-slate-400">{tarikhMs(p.tarikh)}</div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5 text-xs">
        <button onClick={async () => { await simpanPengumuman(p.id, { diterbitkan: !p.diterbitkan }); onDone(); }} className="font-semibold text-surau hover:underline">{p.diterbitkan ? "Sorok" : "Terbit"}</button>
        <button onClick={() => setEdit(true)} className="font-semibold text-slate-600 hover:underline">Edit</button>
        <button onClick={async () => { if (confirm("Padam pengumuman ini?")) { await padamPengumuman(p.id); onDone(); } }} className="font-semibold text-red-600 hover:underline">Padam</button>
      </div>
    </div>
  );
}
