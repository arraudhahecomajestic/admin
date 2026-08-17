"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hantarMinat } from "@/app/tender/actions";

export default function BorangMinatTender({ tenderId }: { tenderId: string }) {
  const [f, setF] = useState({ nama: "", syarikat: "", telefon: "", emel: "", harga_tawaran: "", catatan: "" });
  const [urlDok, setUrlDok] = useState("");
  const [namaDok, setNamaDok] = useState("");
  const [muat, setMuat] = useState(false);
  const [hantar, setHantar] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const [ralat, setRalat] = useState("");
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function naik(e: React.ChangeEvent<HTMLInputElement>) {
    const fail = e.target.files?.[0];
    if (!fail) return;
    setRalat(""); setMuat(true);
    const supabase = createClient();
    const ext = fail.name.split(".").pop() || "pdf";
    const path = `tender/minat/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("salinan-kp").upload(path, fail, { contentType: fail.type || undefined });
    setMuat(false);
    if (error) { setRalat("Gagal muat naik: " + error.message); return; }
    setUrlDok(`salinan-kp/${path}`); setNamaDok(fail.name);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setRalat("");
    setHantar(true);
    const res = await hantarMinat({ tender_id: tenderId, ...f, url_dokumen: urlDok, nama_dokumen: namaDok });
    setHantar(false);
    if (!res.ok) { setRalat(res.msg ?? "Ralat."); return; }
    setSelesai(true);
  }

  if (selesai) {
    return (
      <div className="rounded-xl border-2 border-green-500 bg-green-50 p-5 text-center">
        <div className="text-3xl">✓</div>
        <p className="mt-1 font-semibold text-slate-900">Minat anda telah dihantar!</p>
        <p className="mt-1 text-sm text-slate-600">Urus setia surau akan menghubungi anda. Terima kasih.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border-2 border-surau/30 bg-surau/5 p-5">
      <h3 className="font-semibold text-surau">Nyata Minat / Sebut Harga</h3>
      <input required placeholder="Nama anda *" className="inp" value={f.nama} onChange={(e) => set("nama", e.target.value)} />
      <input placeholder="Nama syarikat (jika ada)" className="inp" value={f.syarikat} onChange={(e) => set("syarikat", e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input placeholder="No. telefon *" className="inp" value={f.telefon} onChange={(e) => set("telefon", e.target.value)} />
        <input type="email" placeholder="E-mel" className="inp" value={f.emel} onChange={(e) => set("emel", e.target.value)} />
      </div>
      <input type="number" min="0" step="0.01" placeholder="Anggaran sebut harga (RM) — pilihan" className="inp" value={f.harga_tawaran} onChange={(e) => set("harga_tawaran", e.target.value)} />
      <textarea rows={3} placeholder="Catatan / cadangan ringkas (pilihan)" className="inp" value={f.catatan} onChange={(e) => set("catatan", e.target.value)} />
      <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white p-2.5 text-sm hover:border-surau">
        <input type="file" accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx" className="hidden" onChange={naik} />
        {urlDok ? <span className="font-medium text-green-600">✓ {namaDok}</span> : muat ? <span className="text-amber-600">Memuat naik…</span> : <span className="text-slate-600">Lampir sebut harga / profil (pilihan)</span>}
      </label>
      {ralat && <p className="text-sm text-red-600">{ralat}</p>}
      <button type="submit" disabled={hantar || muat} className="w-full rounded-lg bg-surau px-6 py-3 font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
        {hantar ? "Menghantar…" : "Hantar Minat"}
      </button>
      <p className="text-center text-xs text-slate-500">Dengan menghantar, anda bersetuju surau menyimpan maklumat ini untuk urusan tender.</p>
      <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </form>
  );
}
