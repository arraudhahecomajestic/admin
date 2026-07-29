"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { tandaDibayar } from "@/app/admin/tuntutan/actions";

export default function SlipTuntutanForm({ id }: { id: string }) {
  const [buka, setBuka] = useState(false);
  const [urlSlip, setUrlSlip] = useState("");
  const [rujukan, setRujukan] = useState("");
  const [muat, setMuat] = useState(false);
  const [hantar, setHantar] = useState(false);
  const [ralat, setRalat] = useState("");

  async function naik(e: React.ChangeEvent<HTMLInputElement>) {
    const fail = e.target.files?.[0];
    if (!fail) return;
    setMuat(true);
    const supabase = createClient();
    const ext = fail.name.split(".").pop() || "jpg";
    const path = `slip/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("salinan-kp").upload(path, fail);
    setMuat(false);
    if (error) { setRalat("Gagal muat naik slip: " + error.message); return; }
    setUrlSlip(`salinan-kp/${path}`);
  }

  async function simpan() {
    setRalat("");
    if (!urlSlip) { setRalat("Sila muat naik slip bayaran."); return; }
    setHantar(true);
    const res = await tandaDibayar({ id, url_slip: urlSlip, rujukan_bayar: rujukan });
    setHantar(false);
    if (!res.ok) { setRalat(res.msg ?? "Ralat."); return; }
    setBuka(false);
  }

  if (!buka) {
    return <button onClick={() => setBuka(true)} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">Tanda Dibayar + Slip</button>;
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-slate-200 p-3">
      <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-2 text-xs hover:border-surau">
        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={naik} />
        {urlSlip ? <span className="font-medium text-green-600">✓ Slip dimuat naik</span> : muat ? <span className="text-amber-600">Memuat naik…</span> : <span className="text-slate-600">📎 Muat naik slip bayaran</span>}
      </label>
      <input value={rujukan} onChange={(e) => setRujukan(e.target.value)} placeholder="No. rujukan bayaran (pilihan)" className="w-full rounded border border-slate-300 px-2 py-1 text-xs" />
      {ralat && <p className="text-xs text-red-600">{ralat}</p>}
      <div className="flex gap-2">
        <button onClick={simpan} disabled={hantar || muat} className="rounded-lg bg-surau px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">{hantar ? "Menyimpan…" : "Sahkan Dibayar"}</button>
        <button onClick={() => setBuka(false)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600">Batal</button>
      </div>
    </div>
  );
}
