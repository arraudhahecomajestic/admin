"use client";

import { useState } from "react";
import { mulaSumbanganProgram } from "@/app/program/actions";
import { BANK_SURAU } from "@/lib/tetapan";

const PRESET = [5, 10, 20, 50, 100];

export default function SumbangProgramForm({
  programId,
  nota,
  bayaranDibuka = false,
}: {
  programId: string;
  nota?: string | null;
  bayaranDibuka?: boolean;
}) {
  const [buka, setBuka] = useState(false);
  const [jumlah, setJumlah] = useState<string>("10");
  const [nama, setNama] = useState("");
  const [emel, setEmel] = useState("");
  const [sedang, setSedang] = useState(false);
  const [ralat, setRalat] = useState("");

  async function bayar() {
    setRalat("");
    const amt = Number(jumlah);
    if (!amt || amt < 1) { setRalat("Sila masukkan jumlah sumbangan (minimum RM1)."); return; }
    if (!emel.includes("@")) { setRalat("Sila isi e-mel yang sah untuk resit."); return; }
    setSedang(true);
    const res = await mulaSumbanganProgram({ program_id: programId, nama, emel, amount: amt });
    if (!res.ok) { setSedang(false); setRalat(res.msg ?? "Ralat pembayaran."); return; }
    if (res.checkout_url) window.location.href = res.checkout_url;
  }

  return (
    <div className="mt-2 rounded-xl border border-surau/30 bg-surau/5 p-4">
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" className="mt-1" checked={buka} onChange={(e) => setBuka(e.target.checked)} />
        <span>Ingin memberi <b>sumbangan khas</b> untuk program ini?</span>
      </label>
      {nota && <p className="mt-1 pl-6 text-xs text-slate-500">{nota}</p>}

      {buka && bayaranDibuka && (
        <div className="mt-3 space-y-3 rounded-lg bg-white p-3 text-sm">
          <div className="font-semibold text-slate-900">Sumbang Online</div>
          <div className="flex flex-wrap gap-2">
            {PRESET.map((a) => (
              <button key={a} type="button" onClick={() => setJumlah(String(a))}
                className={`rounded-lg border-2 px-3 py-1.5 text-sm font-bold ${Number(jumlah) === a ? "border-surau bg-surau/10 text-surau-dark" : "border-slate-200 text-slate-600 hover:border-surau/40"}`}>
                RM{a}
              </button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Jumlah (RM)</span>
              <input className="inp" type="number" min="1" step="1" value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">E-mel (untuk resit)</span>
              <input className="inp" type="email" placeholder="emel@contoh.com" value={emel} onChange={(e) => setEmel(e.target.value)} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Nama <span className="text-slate-400">(pilihan)</span></span>
            <input className="inp" placeholder="Nama anda" value={nama} onChange={(e) => setNama(e.target.value)} />
          </label>
          {ralat && <p className="text-sm text-red-600">{ralat}</p>}
          <button type="button" onClick={bayar} disabled={sedang} className="w-full rounded-lg bg-surau px-5 py-2.5 font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
            {sedang ? "Menyambung ke gerbang bayaran…" : `Sumbang RM${Number(jumlah) || 0} (FPX / Kad / e-Wallet)`}
          </button>
          <p className="text-center text-xs text-slate-500">+ RM1 fi pemprosesan gerbang. Surau terima sumbangan anda penuh.</p>
        </div>
      )}

      {buka && !bayaranDibuka && (
        <div className="mt-3 space-y-2 rounded-lg bg-white p-3 text-sm">
          <div className="font-semibold text-slate-900">Sumbangan melalui Pindahan Bank</div>
          <p className="text-xs text-slate-500">Bayaran online sedang diselenggara. Sila salurkan sumbangan terus ke akaun surau:</p>
          <div className="rounded-lg bg-surau/5 p-3 leading-relaxed">
            <div><span className="text-slate-500">Bank:</span> <b>{BANK_SURAU.bank}</b></div>
            <div><span className="text-slate-500">No. Akaun:</span> <b className="font-mono">{BANK_SURAU.no_akaun}</b></div>
            <div><span className="text-slate-500">Nama:</span> <b>{BANK_SURAU.nama_akaun}</b></div>
          </div>
          <p className="text-xs text-slate-500">Sila catat nama program sebagai rujukan &amp; simpan resit. Jazakumullah khairan.</p>
        </div>
      )}
      <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </div>
  );
}
