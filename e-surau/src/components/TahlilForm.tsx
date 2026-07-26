"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { tambahArwah } from "@/app/tahlil/actions";

export default function TahlilForm() {
  const router = useRouter();
  const [pemohon, setPemohon] = useState("");
  const [telefon, setTelefon] = useState("");
  const [senarai, setSenarai] = useState<string[]>([""]);
  const [hantar, setHantar] = useState(false);
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const isi = senarai.filter((s) => s.trim());
    if (isi.length === 0) { setMsg({ ok: false, text: "Sila isi sekurang-kurangnya satu nama arwah." }); return; }
    setHantar(true);
    const res = await tambahArwah({ pemohon, telefon, senarai: isi.map((nama) => ({ nama })) });
    setHantar(false);
    if (!res.ok) { setMsg({ ok: false, text: res.msg ?? "Ralat." }); return; }
    setMsg({ ok: true, text: `Terima kasih. ${res.bil} nama arwah telah dihantar. Semoga Allah mencucuri rahmat.` });
    setSenarai([""]);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
      {msg && (
        <div className={`rounded-lg border p-3 text-sm ${msg.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Nama Anda (pemohon)</span>
          <input className="inp" value={pemohon} onChange={(e) => setPemohon(e.target.value)} /></label>
        <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">No. Telefon</span>
          <input className="inp" value={telefon} onChange={(e) => setTelefon(e.target.value)} /></label>
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-slate-700">Nama Arwah</span>
        <p className="text-xs text-slate-500">Tulis nama penuh dengan <b>bin / binti</b>.</p>
        {senarai.map((nama, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="inp flex-1"
              placeholder="cth: Ahmad bin Ismail / Fatimah binti Ali"
              value={nama}
              onChange={(e) => setSenarai((s) => s.map((r, idx) => (idx === i ? e.target.value : r)))}
            />
            {senarai.length > 1 && (
              <button type="button" onClick={() => setSenarai((s) => s.filter((_, idx) => idx !== i))} className="text-sm font-medium text-red-600 hover:underline">✕</button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setSenarai((s) => [...s, ""])} className="rounded-lg bg-surau/10 px-3 py-1.5 text-sm font-semibold text-surau hover:bg-surau/20">+ Tambah nama</button>
      </div>

      <button type="submit" disabled={hantar} className="w-full rounded-lg bg-surau px-6 py-3 font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
        {hantar ? "Menghantar…" : "Hantar Nama Arwah"}
      </button>

      <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </form>
  );
}
