"use client";

import { useState } from "react";
import { checkInKehadiran } from "@/app/program/actions";

export default function CheckInKehadiranForm({ programId }: { programId: string }) {
  const [telefon, setTelefon] = useState("");
  const [nama, setNama] = useState("");
  const [bil, setBil] = useState("1");
  const [asal, setAsal] = useState<"" | "tempatan" | "luar">("");
  const [perlubutiran, setPerluButiran] = useState(false); // tunjuk medan nama+asal bila bukan ahli & tiada RSVP
  const [busy, setBusy] = useState(false);
  const [hasil, setHasil] = useState<null | { ok: boolean; status?: string; nama?: string; bil?: number; adalah_ahli?: boolean; asal?: string; msg?: string }>(null);

  async function hantar() {
    setBusy(true); setHasil(null);
    const res = await checkInKehadiran({
      program_id: programId,
      telefon,
      nama: perluButiran ? nama : undefined,
      bil_orang: perluButiran ? Number(bil) : undefined,
      asal: perluButiran ? asal : undefined,
    });
    setBusy(false);
    if (res.ok && res.status === "perlu_nama") { setPerluButiran(true); return; }
    setHasil(res);
  }

  function semula() {
    setHasil(null); setTelefon(""); setNama(""); setBil("1"); setAsal(""); setPerluButiran(false);
  }

  if (hasil?.ok && (hasil.status === "hadir" || hasil.status === "walkin" || hasil.status === "sudah")) {
    const sudah = hasil.status === "sudah";
    const bukanAhli = hasil.adalah_ahli === false;
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <div className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-3xl ${sudah ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-700"}`}>
          {sudah ? "!" : "✓"}
        </div>
        <h2 className="text-xl font-bold text-slate-900">{sudah ? "Anda sudah check-in" : "Kehadiran disahkan!"}</h2>
        <p className="mt-2 text-slate-600">
          {hasil.nama ? <b>{hasil.nama}</b> : "Selamat datang"}
          {hasil.bil && hasil.bil > 1 ? ` · ${hasil.bil} orang` : ""}.
          {sudah ? " Tiada perlu check-in semula." : " Terima kasih & selamat menyertai program."}
        </p>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {hasil.adalah_ahli
            ? <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Ahli kariah berdaftar</span>
            : <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Belum berdaftar sebagai ahli kariah</span>}
          {hasil.asal === "tempatan" && <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Kariah Eco Majestic</span>}
          {hasil.asal === "luar" && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Dari luar</span>}
        </div>

        {bukanAhli && (
          <div className="mt-5 rounded-xl border-2 border-surau/30 bg-surau/5 p-4">
            <p className="text-sm font-semibold text-slate-800">Anda belum jadi ahli kariah?</p>
            <p className="mt-1 text-sm text-slate-600">Daftar percuma untuk menikmati khairat kematian, kemudahan surau &amp; makluman program.</p>
            <a href="/daftar" className="mt-3 inline-block rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark">Daftar Ahli Kariah (Percuma) →</a>
          </div>
        )}

        <button onClick={semula} className="mt-5 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Check-in orang lain
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      {hasil && !hasil.ok && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{hasil.msg}</div>}
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">No. Telefon (yang anda guna semasa RSVP / daftar) *</span>
          <input
            value={telefon}
            onChange={(e) => { setTelefon(e.target.value); setPerluButiran(false); }}
            type="tel"
            inputMode="numeric"
            placeholder="cth: 0123456789"
            className="inp"
          />
        </label>

        {perluButiran && (
          <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">No. telefon ini tiada dalam senarai. Isi maklumat untuk check-in:</p>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Nama *</span>
              <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama anda" className="inp" />
            </label>
            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700">Anda dari mana? *</span>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setAsal("tempatan")} className={`rounded-lg border-2 px-3 py-2 text-sm font-semibold ${asal === "tempatan" ? "border-surau bg-surau/10 text-surau-dark" : "border-slate-200 text-slate-600"}`}>Eco Majestic (kariah)</button>
                <button type="button" onClick={() => setAsal("luar")} className={`rounded-lg border-2 px-3 py-2 text-sm font-semibold ${asal === "luar" ? "border-surau bg-surau/10 text-surau-dark" : "border-slate-200 text-slate-600"}`}>Dari luar</button>
              </div>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Bilangan hadir (termasuk anda)</span>
              <input value={bil} onChange={(e) => setBil(e.target.value)} type="number" min="1" className="inp" />
            </label>
          </div>
        )}

        <button onClick={hantar} disabled={busy} className="w-full rounded-lg bg-surau px-5 py-3 text-base font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
          {busy ? "Menyemak…" : perluButiran ? "Sahkan Kehadiran" : "Sahkan Kehadiran"}
        </button>
      </div>
      <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.6rem .75rem;font-size:1rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </div>
  );
}
