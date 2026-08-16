"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { naikkanGaji } from "@/app/admin/staf/gaji/actions";

export default function BorangKenaikanGaji({
  profilId, gajiPokokSemasa, elaunPerkhidmatanSemasa, aktifSemasa, layak,
}: {
  profilId: string;
  gajiPokokSemasa: number;
  elaunPerkhidmatanSemasa: number;
  aktifSemasa: boolean;
  layak: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [penilaianId, setPenilaianId] = useState("");
  const [gajiPokok, setGajiPokok] = useState(String(gajiPokokSemasa || 2000));
  const [perkhidmatan, setPerkhidmatan] = useState(String(elaunPerkhidmatanSemasa || 270));
  const [aktif, setAktif] = useState(aktifSemasa);
  const [tarikh, setTarikh] = useState(new Date().toISOString().slice(0, 10));
  const [catatan, setCatatan] = useState("");
  const [hantar, setHantar] = useState(false);
  const [ralat, setRalat] = useState("");

  if (!layak.length) {
    return (
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        <b>Tiada penilaian yang lulus &amp; disahkan.</b> Kenaikan gaji tidak boleh dibuat tanpa asas penilaian.
        Sila lengkapkan &amp; sahkan penilaian dahulu di <Link href="/admin/staf/penilaian" className="font-semibold underline">Penilaian Prestasi</Link>.
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setRalat("");
    if (!penilaianId) { setRalat("Sila pilih penilaian rujukan."); return; }
    setHantar(true);
    const res = await naikkanGaji({
      profil_id: profilId, penilaian_id: penilaianId,
      gaji_pokok_baru: gajiPokok, elaun_perkhidmatan_baru: perkhidmatan,
      perkhidmatan_aktif_baru: aktif, berkuatkuasa: tarikh, catatan,
    });
    setHantar(false);
    if (!res.ok) { setRalat(res.msg ?? "Ralat."); return; }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border-2 border-surau/30 bg-surau/5 p-5">
      <h2 className="font-semibold text-slate-900">Laksanakan Kenaikan</h2>
      {ralat && <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">{ralat}</div>}

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Penilaian rujukan (lulus &amp; disahkan) *</span>
        <select value={penilaianId} onChange={(e) => setPenilaianId(e.target.value)} className="inp">
          <option value="">— Pilih penilaian —</option>
          {layak.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Gaji pokok baru (RM)</span>
          <input type="number" min="0" step="0.01" value={gajiPokok} onChange={(e) => setGajiPokok(e.target.value)} className="inp" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Elaun Perkhidmatan (RM)</span>
          <input type="number" min="0" step="0.01" value={perkhidmatan} onChange={(e) => setPerkhidmatan(e.target.value)} className="inp" />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={aktif} onChange={(e) => setAktif(e.target.checked)} />
        Aktifkan Elaun Perkhidmatan (selepas tamat percubaan)
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Berkuat kuasa</span>
          <input type="date" value={tarikh} onChange={(e) => setTarikh(e.target.value)} className="inp" />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Catatan (pilihan)</span>
        <input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="cth: Kenaikan selepas percubaan, diluluskan AJK 16 Ogos 2026" className="inp" />
      </label>

      <button type="submit" disabled={hantar} className="rounded-lg bg-surau px-6 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
        {hantar ? "Menyimpan…" : "Sahkan Kenaikan Gaji"}
      </button>

      <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </form>
  );
}
