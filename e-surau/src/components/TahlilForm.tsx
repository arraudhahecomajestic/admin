"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { tambahArwah, mulaSumbanganTahlil } from "@/app/tahlil/actions";
import { BANK_SURAU } from "@/lib/tetapan";

export default function TahlilForm({ bayaranDibuka = false }: { bayaranDibuka?: boolean }) {
  const router = useRouter();
  const [pemohon, setPemohon] = useState("");
  const [telefon, setTelefon] = useState("");
  const [senarai, setSenarai] = useState<string[]>([""]);
  const [nakSumbang, setNakSumbang] = useState(false);
  const [jumlah, setJumlah] = useState("");
  const [emelSumbang, setEmelSumbang] = useState("");
  const [bayarSedang, setBayarSedang] = useState(false);
  const [bayarRalat, setBayarRalat] = useState("");
  const [hantar, setHantar] = useState(false);
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);

  async function bayarSumbangan() {
    setBayarRalat("");
    const amt = Number(jumlah);
    if (!amt || amt < 1) { setBayarRalat("Sila masukkan jumlah sumbangan (minimum RM1)."); return; }
    if (!emelSumbang.includes("@")) { setBayarRalat("Sila isi e-mel yang sah untuk resit."); return; }
    setBayarSedang(true);
    const res = await mulaSumbanganTahlil({ nama: pemohon, emel: emelSumbang, telefon, amount: amt });
    if (!res.ok) { setBayarSedang(false); setBayarRalat(res.msg ?? "Ralat pembayaran."); return; }
    if (res.checkout_url) window.location.href = res.checkout_url;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!pemohon.trim()) { setMsg({ ok: false, text: "Sila isi nama anda." }); return; }
    if (!telefon.trim()) { setMsg({ ok: false, text: "Sila isi no. telefon anda." }); return; }
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
        <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Nama Anda (pemohon) *</span>
          <input className="inp" value={pemohon} onChange={(e) => setPemohon(e.target.value)} /></label>
        <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">No. Telefon *</span>
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

      {/* Sumbangan jamuan */}
      <div className="rounded-lg border border-surau/30 bg-surau/5 p-3">
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-1" checked={nakSumbang} onChange={(e) => setNakSumbang(e.target.checked)} />
          <span>Adakah anda ingin menyumbang untuk <b>jamuan Yaasin & Tahlil</b>?</span>
        </label>
        {nakSumbang && bayaranDibuka && (
          <div className="mt-3 space-y-3 rounded-lg bg-white p-3 text-sm">
            <div className="font-semibold text-slate-900">Bayar Sumbangan Online</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Jumlah Sumbangan (RM)</span>
                <input className="inp" type="number" min="1" step="1" placeholder="cth: 50" value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">E-mel (untuk resit)</span>
                <input className="inp" type="email" placeholder="emel@contoh.com" value={emelSumbang} onChange={(e) => setEmelSumbang(e.target.value)} />
              </label>
            </div>
            {bayarRalat && <p className="text-sm text-red-600">{bayarRalat}</p>}
            <button type="button" onClick={bayarSumbangan} disabled={bayarSedang} className="w-full rounded-lg bg-surau px-5 py-2.5 font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
              {bayarSedang ? "Menyambung ke gerbang bayaran…" : "Bayar Sumbangan (FPX / Kad / e-Wallet)"}
            </button>
            <p className="text-center text-xs text-slate-500">+ RM1 fi pemprosesan gerbang. Surau terima sumbangan anda penuh.</p>
            <div className="rounded-lg bg-slate-50 p-2 text-xs text-slate-500">
              Atau transfer manual: <b>{BANK_SURAU.bank}</b> · <b className="font-mono">{BANK_SURAU.no_akaun}</b> · {BANK_SURAU.nama_akaun}. Jazakumullah khairan.
            </div>
          </div>
        )}
        {nakSumbang && !bayaranDibuka && (
          <div className="mt-3 space-y-2 rounded-lg bg-white p-3 text-sm">
            <div className="font-semibold text-slate-900">Sumbangan melalui Pindahan Bank</div>
            <p className="text-xs text-slate-500">
              Bayaran online sedang diselenggara buat sementara waktu. Sila salurkan sumbangan terus ke akaun surau:
            </p>
            <div className="rounded-lg bg-surau/5 p-3 leading-relaxed">
              <div><span className="text-slate-500">Bank:</span> <b>{BANK_SURAU.bank}</b></div>
              <div><span className="text-slate-500">No. Akaun:</span> <b className="font-mono">{BANK_SURAU.no_akaun}</b></div>
              <div><span className="text-slate-500">Nama:</span> <b>{BANK_SURAU.nama_akaun}</b></div>
            </div>
            <p className="text-xs text-slate-500">
              Sila simpan resit pindahan &amp; maklumkan kepada AJK surau. Jazakumullah khairan.
            </p>
          </div>
        )}
      </div>

      <button type="submit" disabled={hantar} className="w-full rounded-lg bg-surau px-6 py-3 font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
        {hantar ? "Menghantar…" : "Hantar Nama Arwah"}
      </button>

      <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </form>
  );
}
