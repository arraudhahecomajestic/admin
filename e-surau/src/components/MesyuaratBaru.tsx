"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ciptaMesyuarat } from "@/app/admin/su/mesyuarat/actions";
import { JENIS_MESYUARAT } from "@/lib/su";

export default function MesyuaratBaru() {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [f, setF] = useState({ tajuk: "", jenis: "AJK", tarikh: "", masa: "", tempat: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function cipta() {
    setBusy(true); setMsg("");
    const res = await ciptaMesyuarat(f);
    setBusy(false);
    if (!res.ok) { setMsg(res.msg ?? "Ralat."); return; }
    if (res.id) router.push(`/admin/su/mesyuarat/${res.id}`);
  }

  if (!buka) {
    return (
      <button onClick={() => setBuka(true)} className="rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark">
        + Mesyuarat Baru
      </button>
    );
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 font-semibold text-slate-900">Mesyuarat Baru</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={f.tajuk} onChange={(e) => set("tajuk", e.target.value)} placeholder="Tajuk (cth: Mesyuarat AJK Bil 3/2026)" className="inp sm:col-span-2" />
        <label className="text-sm text-slate-600">Jenis
          <select value={f.jenis} onChange={(e) => set("jenis", e.target.value)} className="inp">
            {JENIS_MESYUARAT.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </label>
        <label className="text-sm text-slate-600">Tarikh<input type="date" value={f.tarikh} onChange={(e) => set("tarikh", e.target.value)} className="inp" /></label>
        <label className="text-sm text-slate-600">Masa<input value={f.masa} onChange={(e) => set("masa", e.target.value)} placeholder="cth: 9:00 malam" className="inp" /></label>
        <label className="text-sm text-slate-600">Tempat<input value={f.tempat} onChange={(e) => set("tempat", e.target.value)} placeholder="cth: Ruang solat utama" className="inp" /></label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={cipta} disabled={busy} className="rounded-lg bg-surau px-5 py-2 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">{busy ? "…" : "Cipta & Isi Minit"}</button>
        <button onClick={() => setBuka(false)} className="text-sm text-slate-500">Batal</button>
        {msg && <span className="text-sm text-red-600">{msg}</span>}
      </div>
      <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none;margin-top:.25rem}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </section>
  );
}
