"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hantarTuntutan } from "@/app/pembekal/portal/actions";

export default function TuntutanPembekalForm() {
  const [butiran, setButiran] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [urlDok, setUrlDok] = useState("");
  const [muat, setMuat] = useState(false);
  const [hantar, setHantar] = useState(false);
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);

  async function naikDok(e: React.ChangeEvent<HTMLInputElement>) {
    const fail = e.target.files?.[0];
    if (!fail) return;
    setMuat(true);
    const supabase = createClient();
    const ext = fail.name.split(".").pop() || "pdf";
    const path = `tuntutan/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("salinan-kp").upload(path, fail);
    setMuat(false);
    if (error) { setMsg({ ok: false, text: "Gagal muat naik dokumen: " + error.message }); return; }
    setUrlDok(`salinan-kp/${path}`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const j = Number(jumlah);
    if (!butiran.trim()) { setMsg({ ok: false, text: "Sila isi butiran tuntutan." }); return; }
    if (!j || j <= 0) { setMsg({ ok: false, text: "Sila isi jumlah yang sah." }); return; }
    setHantar(true);
    const res = await hantarTuntutan({ butiran, jumlah: j, url_dokumen: urlDok });
    setHantar(false);
    if (!res.ok) { setMsg({ ok: false, text: res.msg ?? "Ralat." }); return; }
    setMsg({ ok: true, text: "Tuntutan berjaya dihantar. Ia akan disemak oleh AJK." });
    setButiran(""); setJumlah(""); setUrlDok("");
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-surau">Hantar Tuntutan Baharu</h2>
      {msg && <div className={`rounded-lg border p-3 text-sm ${msg.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>{msg.text}</div>}
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Butiran / Tujuan Tuntutan *</span>
        <textarea className="inp" rows={3} value={butiran} onChange={(e) => setButiran(e.target.value)} placeholder="cth: Elaun bertugas imam bulan Julai 2026 / Bekalan makanan program" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Jumlah (RM) *</span>
        <input className="inp" type="number" step="0.01" min="0.01" value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
      </label>
      <div>
        <span className="mb-1 block text-sm font-medium text-slate-700">Dokumen Sokongan (invois / resit)</span>
        <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-3 text-sm hover:border-surau">
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={naikDok} />
          {urlDok ? <span className="font-medium text-green-600">✓ Dokumen dimuat naik — ketik untuk tukar</span>
            : muat ? <span className="text-amber-600">Memuat naik…</span>
            : <span className="text-slate-600">📎 Muat naik invois / resit (PDF atau gambar)</span>}
        </label>
      </div>
      <button type="submit" disabled={hantar || muat} className="w-full rounded-lg bg-surau px-6 py-3 font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
        {hantar ? "Menghantar…" : "Hantar Tuntutan"}
      </button>
      <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </form>
  );
}
