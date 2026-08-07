"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { daftarProgramManual } from "@/app/program/actions";
import { BANK_SURAU } from "@/lib/tetapan";
import TermaProgram from "@/components/TermaProgram";

export default function BorangDaftarProgramManual({ programId, yuran, tajuk, rujBayar }: { programId: string; yuran: number; tajuk?: string; rujBayar?: string }) {
  const [f, setF] = useState<any>({ nama_penjaga: "", telefon_penjaga: "", emel: "", bilangan: 1, senarai_anak: "", maklumat_kesihatan: "" });
  const [urlResit, setUrlResit] = useState("");
  const [muat, setMuat] = useState(false);
  const [consent, setConsent] = useState(false);
  const [foto, setFoto] = useState(true);
  const [hantar, setHantar] = useState(false);
  const [ralat, setRalat] = useState("");
  const [siap, setSiap] = useState(false);
  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));

  const bil = Math.max(1, Math.floor(Number(f.bilangan) || 1));
  const jumlah = yuran * bil;

  async function naikResit(e: React.ChangeEvent<HTMLInputElement>) {
    const fail = e.target.files?.[0];
    if (!fail) return;
    setMuat(true); setRalat("");
    const supabase = createClient();
    const ext = fail.name.split(".").pop() || "jpg";
    const path = `resit-program/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("salinan-kp").upload(path, fail);
    setMuat(false);
    if (error) { setRalat("Gagal muat naik resit: " + error.message); return; }
    setUrlResit(`salinan-kp/${path}`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setRalat("");
    if (!consent) { setRalat("Sila tandakan kebenaran ibu bapa/penjaga."); return; }
    if (!urlResit) { setRalat("Sila muat naik resit/bukti bayaran dahulu."); return; }
    setHantar(true);
    const res = await daftarProgramManual({ program_id: programId, ...f, url_resit: urlResit, kebenaran_ibubapa: consent, kebenaran_foto: foto });
    setHantar(false);
    if (!res.ok) { setRalat(res.msg || "Ralat. Sila cuba lagi."); return; }
    setSiap(true);
  }

  if (siap) {
    return (
      <div className="mt-2 rounded-xl border-2 border-green-500 bg-green-50 p-5 text-center">
        <div className="text-3xl">✓</div>
        <div className="mt-1 text-lg font-bold text-green-700">Pendaftaran diterima!</div>
        <p className="mt-1 text-sm text-green-700">
          Terima kasih. Bayaran &amp; borang anda akan disemak oleh urus setia. Tempat <b>disahkan selepas bukti bayaran diterima</b>.
          Sila lengkapkan borang penuh (butiran peranti, kesihatan, penjaga) & bawa pada hari program.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2 space-y-4 rounded-xl border border-surau/20 bg-surau/5 p-4">
      <div>
        <div className="text-sm font-bold text-slate-800">Borang Pendaftaran (Bayaran Manual)</div>
        <p className="text-xs text-slate-500">Yuran: <b className="text-surau">RM{yuran.toFixed(2)}</b> seorang. Bayar melalui pindahan bank, kemudian muat naik resit di bawah.</p>
      </div>

      {/* Langkah 1: Maklumat penjaga & anak */}
      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">1. Maklumat Ibu Bapa / Penjaga</legend>
        <input required placeholder="Nama penuh ibu bapa/penjaga *" className="inp" value={f.nama_penjaga} onChange={(e) => set("nama_penjaga", e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <input required placeholder="No. telefon (WhatsApp) *" className="inp" value={f.telefon_penjaga} onChange={(e) => set("telefon_penjaga", e.target.value)} />
          <input required type="email" placeholder="E-mel *" className="inp" value={f.emel} onChange={(e) => set("emel", e.target.value)} />
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">2. Peserta</legend>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Bilangan anak didaftarkan</span>
          <input type="number" min="1" max="10" className="inp w-32" value={f.bilangan} onChange={(e) => set("bilangan", e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Nama penuh anak (satu nama satu baris)</span>
          <textarea required rows={Math.min(6, Math.max(2, bil))} placeholder={"cth:\nAhmad bin Ali\nAisyah binti Ali"} className="inp" value={f.senarai_anak} onChange={(e) => set("senarai_anak", e.target.value)} />
          <span className="mt-1 block text-[11px] text-slate-400">Butiran penuh (umur, sekolah, peranti robotik) diisi dalam borang penuh pada hari program.</span>
        </label>
        <textarea rows={2} placeholder="Kesihatan / alahan / ubat (jika ada). Tulis 'Tiada' jika tiada." className="inp" value={f.maklumat_kesihatan} onChange={(e) => set("maklumat_kesihatan", e.target.value)} />
      </fieldset>

      {/* Langkah 3: Bayaran */}
      <fieldset className="space-y-2 rounded-lg border border-surau/30 bg-white p-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-surau">3. Bayaran</legend>
        <div className="rounded-lg bg-surau/5 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Jumlah perlu dibayar</span>
            <span className="text-lg font-bold text-surau-dark">RM{jumlah.toFixed(2)}</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">RM{yuran.toFixed(2)} × {bil} anak</div>
          <div className="mt-3 border-t border-surau/20 pt-2 text-sm">
            <div className="font-semibold text-slate-800">Pindahan ke akaun surau:</div>
            <div className="mt-1 text-slate-700">{BANK_SURAU.bank}</div>
            <div className="font-mono text-base font-bold text-slate-900">{BANK_SURAU.no_akaun}</div>
            <div className="text-slate-600">{BANK_SURAU.nama_akaun}</div>
            <div className="mt-2 rounded-md bg-amber-50 p-2 text-[12px] text-amber-800">
              <b>Penting:</b> Semasa pindahan, letak rujukan/keterangan: <b>{(rujBayar || tajuk || "Yuran Program").trim()}</b>
            </div>
          </div>
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Muat naik resit / bukti bayaran *</span>
          <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-3 text-sm hover:border-surau">
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={naikResit} />
            {urlResit ? <span className="font-medium text-green-600">✓ Resit dimuat naik — ketik untuk tukar</span>
              : muat ? <span className="text-amber-600">Memuat naik…</span>
              : <span className="text-slate-600">Muat naik resit pindahan (gambar atau PDF)</span>}
          </label>
        </div>
      </fieldset>

      <TermaProgram />

      <div className="space-y-2 rounded-lg bg-white p-3">
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>Saya ibu bapa/penjaga telah <b>membaca &amp; bersetuju</b> dengan Terma, Kebenaran &amp; Penepian Liabiliti di atas, <b>memberi kebenaran</b> anak saya menyertai program ini, dan mengesahkan maklumat yang diberi adalah benar. *</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-1" checked={foto} onChange={(e) => setFoto(e.target.checked)} />
          <span>Saya membenarkan foto/video peserta digunakan untuk dokumentasi & publisiti surau.</span>
        </label>
      </div>

      {ralat && <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">{ralat}</div>}

      <button type="submit" disabled={hantar || muat} className="w-full rounded-lg bg-surau px-5 py-3 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
        {hantar ? "Menghantar…" : "Hantar Pendaftaran"}
      </button>
      <p className="text-center text-xs text-slate-400">Tempat disahkan selepas bukti bayaran disemak oleh urus setia.</p>
    </form>
  );
}
