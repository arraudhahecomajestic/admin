"use client";

import { useState } from "react";
import { KATEGORI_VENDOR, JENIS_PEMOHON } from "@/lib/vendor";
import { daftarVendor } from "@/app/vendor/actions";

export default function VendorForm() {
  const [f, setF] = useState<any>({ jenis_pemohon: "Syarikat", nama: "", no_pendaftaran: "", pegawai: "", telefon: "", whatsapp: "", emel: "", alamat: "", keterangan: "" });
  const [kategori, setKategori] = useState<Set<string>>(new Set());
  const [hantar, setHantar] = useState(false);
  const [selesai, setSelesai] = useState<null | { ok: boolean; msg: string }>(null);

  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));
  const toggle = (k: string) => setKategori((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.nama.trim()) { setSelesai({ ok: false, msg: "Sila isi nama syarikat/individu." }); return; }
    if (!f.telefon.trim()) { setSelesai({ ok: false, msg: "Sila isi no. telefon." }); return; }
    if (kategori.size === 0) { setSelesai({ ok: false, msg: "Sila pilih sekurang-kurangnya satu kategori." }); return; }
    setHantar(true);
    const res = await daftarVendor({ ...f, kategori: [...kategori] });
    setHantar(false);
    if (!res.ok) { setSelesai({ ok: false, msg: res.msg ?? "Ralat." }); return; }
    setSelesai({ ok: true, msg: `Permohonan vendor berjaya dihantar! No. Rujukan: ${res.no}. AJK akan semak permohonan anda.` });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (selesai?.ok) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
        <h2 className="text-xl font-bold text-slate-900">Terima kasih!</h2>
        <p className="mt-2 text-slate-600">{selesai.msg}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
      {selesai && !selesai.ok && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{selesai.msg}</div>}

      <F l="Jenis Pemohon">
        <select className="inp" value={f.jenis_pemohon} onChange={(e) => set("jenis_pemohon", e.target.value)}>
          {JENIS_PEMOHON.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
      </F>
      <F l="Nama Syarikat / Individu *"><input className="inp" value={f.nama} onChange={(e) => set("nama", e.target.value)} /></F>
      <F l="No. SSM / No. KP"><input className="inp" value={f.no_pendaftaran} onChange={(e) => set("no_pendaftaran", e.target.value)} /></F>

      <div>
        <span className="mb-1 block text-sm font-medium text-slate-700">Kategori Perkhidmatan * <span className="font-normal text-slate-400">(boleh pilih lebih satu)</span></span>
        <div className="grid gap-2 sm:grid-cols-2">
          {KATEGORI_VENDOR.map((k) => (
            <label key={k} className={`flex items-center gap-2 rounded-lg border p-2 text-sm ${kategori.has(k) ? "border-surau bg-surau/5" : "border-slate-200"}`}>
              <input type="checkbox" checked={kategori.has(k)} onChange={() => toggle(k)} /> {k}
            </label>
          ))}
        </div>
      </div>

      <F l="Nama Pegawai Untuk Dihubungi"><input className="inp" value={f.pegawai} onChange={(e) => set("pegawai", e.target.value)} /></F>
      <div className="grid gap-3 sm:grid-cols-3">
        <F l="No. Telefon *"><input className="inp" value={f.telefon} onChange={(e) => set("telefon", e.target.value)} /></F>
        <F l="WhatsApp"><input className="inp" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></F>
        <F l="E-mel"><input className="inp" type="email" value={f.emel} onChange={(e) => set("emel", e.target.value)} /></F>
      </div>
      <F l="Alamat"><textarea className="inp" rows={2} value={f.alamat} onChange={(e) => set("alamat", e.target.value)} /></F>
      <F l="Keterangan Perkhidmatan / Pengalaman"><textarea className="inp" rows={3} value={f.keterangan} onChange={(e) => set("keterangan", e.target.value)} /></F>

      <button type="submit" disabled={hantar} className="w-full rounded-lg bg-surau px-6 py-3 font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
        {hantar ? "Menghantar…" : "Hantar Permohonan Vendor"}
      </button>

      <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </form>
  );
}

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return (<label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">{l}</span>{children}</label>);
}
