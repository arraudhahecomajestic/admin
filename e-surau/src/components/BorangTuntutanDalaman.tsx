"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hantarTuntutanDalaman } from "@/app/admin/tuntutan-saya/actions";

export default function BorangTuntutanDalaman() {
  const [butiran, setButiran] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [tarikhBekal, setTarikhBekal] = useState("");
  const [bank, setBank] = useState("");
  const [noAkaun, setNoAkaun] = useState("");
  const [namaAkaun, setNamaAkaun] = useState("");
  const [urlDok, setUrlDok] = useState("");
  const [muat, setMuat] = useState(false);
  const [hantar, setHantar] = useState(false);
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);

  async function naikDok(e: React.ChangeEvent<HTMLInputElement>) {
    const fail = e.target.files?.[0];
    if (!fail) return;
    setMuat(true); setMsg(null);
    const supabase = createClient();
    const ext = fail.name.split(".").pop() || "jpg";
    const path = `tuntutan-dalaman/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("salinan-kp").upload(path, fail);
    setMuat(false);
    if (error) { setMsg({ ok: false, text: "Gagal muat naik: " + error.message }); return; }
    setUrlDok(`salinan-kp/${path}`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const j = Number(jumlah);
    if (!butiran.trim()) { setMsg({ ok: false, text: "Sila isi butiran tuntutan." }); return; }
    if (!j || j <= 0) { setMsg({ ok: false, text: "Sila isi jumlah yang sah." }); return; }
    if (!tarikhBekal) { setMsg({ ok: false, text: "Sila isi tarikh pembekalan/perkhidmatan." }); return; }
    if (!bank.trim()) { setMsg({ ok: false, text: "Sila isi nama bank." }); return; }
    if (!noAkaun.trim()) { setMsg({ ok: false, text: "Sila isi no. akaun bank." }); return; }
    if (!urlDok) { setMsg({ ok: false, text: "Sila muat naik resit/bukti pembelian." }); return; }
    setHantar(true);
    const res = await hantarTuntutanDalaman({ butiran, jumlah: j, url_dokumen: urlDok, tarikh_bekal: tarikhBekal, bank, no_akaun: noAkaun, nama_akaun: namaAkaun });
    setHantar(false);
    if (!res.ok) { setMsg({ ok: false, text: res.msg ?? "Ralat." }); return; }
    setMsg({ ok: true, text: "Tuntutan berjaya dihantar. Ia akan disemak AJK bertugas, diproses Bendahari & diluluskan Pengerusi." });
    setButiran(""); setJumlah(""); setTarikhBekal(""); setBank(""); setNoAkaun(""); setNamaAkaun(""); setUrlDok("");
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-surau">Hantar Tuntutan Dalaman</h2>
      <p className="text-xs text-slate-500">Untuk AJK/staf yang berbelanja untuk surau (cth beli barang). Sertakan resit sebagai bukti.</p>
      {msg && <div className={`rounded-lg border p-3 text-sm ${msg.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>{msg.text}</div>}
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Butiran / Tujuan *</span>
        <textarea className="inp" rows={3} value={butiran} onChange={(e) => setButiran(e.target.value)} placeholder="cth: Beli alat pembersih & sampah surau (Julai 2026)" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Jumlah (RM) *</span>
          <input className="inp" type="number" step="0.01" min="0.01" value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Tarikh Pembekalan / Perkhidmatan *</span>
          <input className="inp" type="date" value={tarikhBekal} onChange={(e) => setTarikhBekal(e.target.value)} />
        </label>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
        <div className="mb-2 text-sm font-semibold text-slate-700">Akaun Bank (untuk pembayaran) *</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Nama Bank *</span>
            <input className="inp" value={bank} onChange={(e) => setBank(e.target.value)} placeholder="cth: Maybank, CIMB, BSN" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">No. Akaun *</span>
            <input className="inp" inputMode="numeric" value={noAkaun} onChange={(e) => setNoAkaun(e.target.value)} placeholder="cth: 1234567890" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-slate-600">Nama Pemegang Akaun (pilihan)</span>
            <input className="inp" value={namaAkaun} onChange={(e) => setNamaAkaun(e.target.value)} placeholder="Biar kosong = guna nama anda" />
          </label>
        </div>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-slate-700">Resit / Bukti Pembelian *</span>
        <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-3 text-sm hover:border-surau">
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={naikDok} />
          {urlDok ? <span className="font-medium text-green-600">✓ Resit dimuat naik — ketik untuk tukar</span>
            : muat ? <span className="text-amber-600">Memuat naik…</span>
            : <span className="text-slate-600">Muat naik resit (gambar atau PDF)</span>}
        </label>
      </div>
      <button type="submit" disabled={hantar || muat} className="w-full rounded-lg bg-surau px-6 py-3 font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
        {hantar ? "Menghantar…" : "Hantar Tuntutan"}
      </button>
      <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </form>
  );
}
