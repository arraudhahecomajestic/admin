"use client";

import { useState } from "react";
import { daftarProgramBerbayar } from "@/app/program/actions";
import TermaProgram from "@/components/TermaProgram";

export default function BorangDaftarProgram({ programId, yuran }: { programId: string; yuran: number }) {
  const [f, setF] = useState<any>({
    nama_peserta: "", umur: "", sekolah: "", jantina: "",
    nama_penjaga: "", telefon_penjaga: "", emel: "",
    kontak_kecemasan: "", no_kecemasan: "", maklumat_kesihatan: "",
  });
  const [consent, setConsent] = useState(false);
  const [foto, setFoto] = useState(true);
  const [hantar, setHantar] = useState(false);
  const [ralat, setRalat] = useState("");
  const set = (k: string, v: string) => setF((s: any) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setRalat("");
    if (!consent) { setRalat("Sila tandakan kebenaran ibu bapa/penjaga."); return; }
    setHantar(true);
    const res = await daftarProgramBerbayar({ program_id: programId, ...f, kebenaran_ibubapa: consent, kebenaran_foto: foto });
    if (res.ok && res.checkout_url) { window.location.href = res.checkout_url; return; }
    setHantar(false);
    setRalat(res.msg || "Ralat. Sila cuba lagi.");
  }

  return (
    <form onSubmit={submit} className="mt-2 space-y-4 rounded-xl border border-surau/20 bg-surau/5 p-4">
      <div>
        <div className="text-sm font-bold text-slate-800">Borang Pendaftaran Peserta</div>
        <p className="text-xs text-slate-500">Yuran: <b className="text-surau">RM{yuran.toFixed(2)}</b> — bayaran dalam talian selepas isi borang.</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">Maklumat Peserta</legend>
        <input required placeholder="Nama penuh peserta *" className="inp" value={f.nama_peserta} onChange={(e) => set("nama_peserta", e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <input type="number" min="5" max="25" placeholder="Umur" className="inp" value={f.umur} onChange={(e) => set("umur", e.target.value)} />
          <select className="inp" value={f.jantina} onChange={(e) => set("jantina", e.target.value)}>
            <option value="">Jantina</option><option>Lelaki</option><option>Perempuan</option>
          </select>
        </div>
        <input placeholder="Sekolah" className="inp" value={f.sekolah} onChange={(e) => set("sekolah", e.target.value)} />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ibu Bapa / Penjaga</legend>
        <input required placeholder="Nama ibu bapa/penjaga *" className="inp" value={f.nama_penjaga} onChange={(e) => set("nama_penjaga", e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <input required placeholder="No. telefon (WhatsApp) *" className="inp" value={f.telefon_penjaga} onChange={(e) => set("telefon_penjaga", e.target.value)} />
          <input required type="email" placeholder="E-mel (untuk resit) *" className="inp" value={f.emel} onChange={(e) => set("emel", e.target.value)} />
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kecemasan & Kesihatan</legend>
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Nama kontak kecemasan" className="inp" value={f.kontak_kecemasan} onChange={(e) => set("kontak_kecemasan", e.target.value)} />
          <input placeholder="No. kecemasan" className="inp" value={f.no_kecemasan} onChange={(e) => set("no_kecemasan", e.target.value)} />
        </div>
        <textarea rows={2} placeholder="Maklumat kesihatan / alahan / ubat (jika ada). Tulis 'Tiada' jika tiada." className="inp" value={f.maklumat_kesihatan} onChange={(e) => set("maklumat_kesihatan", e.target.value)} />
      </fieldset>

      <TermaProgram />

      <div className="space-y-2 rounded-lg bg-white p-3">
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>Saya ibu bapa/penjaga telah <b>membaca &amp; bersetuju</b> dengan Terma, Kebenaran &amp; Penepian Liabiliti di atas, <b>memberi kebenaran</b> anak saya menyertai program ini, dan mengesahkan maklumat yang diberi benar. *</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-1" checked={foto} onChange={(e) => setFoto(e.target.checked)} />
          <span>Saya membenarkan foto/video peserta digunakan untuk dokumentasi & publisiti surau.</span>
        </label>
      </div>

      {ralat && <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">{ralat}</div>}

      <button type="submit" disabled={hantar} className="w-full rounded-lg bg-surau px-5 py-3 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
        {hantar ? "Memproses…" : `Daftar & Bayar RM${yuran.toFixed(2)} →`}
      </button>
      <p className="text-center text-xs text-slate-400">Anda akan dibawa ke laman pembayaran selamat (CHIP / FPX & kad).</p>
    </form>
  );
}
