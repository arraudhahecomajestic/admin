"use client";

import { useState } from "react";
import { daftarRsvp, mulaSumbanganProgram } from "@/app/program/actions";
import { BANK_SURAU } from "@/lib/tetapan";

const PRESET = [5, 10, 20, 50, 100];

export default function BorangRsvpProgram({
  programId,
  bayaranDibuka = false,
  sumbanganDibuka = false,
  sumbanganNota,
  rsvpOk = false,
}: {
  programId: string;
  bayaranDibuka?: boolean;
  sumbanganDibuka?: boolean;
  sumbanganNota?: string | null;
  rsvpOk?: boolean;
}) {
  const [nama, setNama] = useState("");
  const [telefon, setTelefon] = useState("");
  const [bil, setBil] = useState("1");
  const [nakSumbang, setNakSumbang] = useState(false);
  const [jumlah, setJumlah] = useState("10");
  const [emel, setEmel] = useState("");
  const [sedang, setSedang] = useState(false);
  const [ralat, setRalat] = useState("");
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);

  async function hantar() {
    setRalat(""); setMsg(null);
    if (!nama.trim()) { setRalat("Sila isi nama anda."); return; }

    const menyumbang = nakSumbang && sumbanganDibuka && bayaranDibuka;
    if (menyumbang) {
      const amt = Number(jumlah);
      if (!amt || amt < 1) { setRalat("Sila masukkan jumlah sumbangan (minimum RM1)."); return; }
      if (!emel.includes("@")) { setRalat("Sila isi e-mel yang sah untuk resit sumbangan."); return; }
    }

    setSedang(true);
    // 1) Daftar kehadiran DAHULU (supaya kehadiran tersimpan walau ke gerbang bayaran).
    const rd = await daftarRsvp({ program_id: programId, nama, telefon, bil_orang: Number(bil) });
    if (!rd.ok) { setSedang(false); setRalat(rd.msg ?? "Ralat pendaftaran."); return; }

    // 2) Jika menyumbang → terus ke gerbang bayaran (kehadiran sudah tersimpan).
    if (menyumbang) {
      const rs = await mulaSumbanganProgram({ program_id: programId, nama, emel, telefon, amount: Number(jumlah) });
      if (!rs.ok) {
        setSedang(false);
        // Kehadiran dah tersimpan; cuma sumbangan gagal.
        setMsg({ ok: true, text: "Kehadiran anda disahkan. (Sumbangan tidak diteruskan: " + (rs.msg ?? "ralat") + ")" });
        return;
      }
      if (rs.checkout_url) { window.location.href = rs.checkout_url; return; }
    }

    // 3) Tiada sumbangan → paparkan pengesahan RSVP.
    window.location.href = `/program/${programId}?rsvp=ok`;
  }

  return (
    <div className="mt-2 grid gap-2 rounded-lg bg-slate-50 p-4">
      <div className="text-sm font-semibold text-slate-800">{rsvpOk ? "Kemas kini kehadiran anda" : "Sahkan Kehadiran (RSVP)"}</div>
      <p className="text-xs text-slate-500">Guna nombor telefon yang sama untuk kemas kini — tak akan jadi pendaftaran berganda.</p>

      {msg && <div className={`rounded-lg border p-2 text-sm ${msg.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>{msg.text}</div>}

      <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama anda" className="inp" />
      <input value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="No. telefon (WhatsApp)" className="inp" />
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Bilangan yang akan hadir (termasuk anda)</span>
        <input value={bil} onChange={(e) => setBil(e.target.value)} type="number" min="1" placeholder="cth: 3 orang" className="inp" />
        <span className="mt-1 block text-[11px] text-slate-400">Contoh: jika anda hadir bersama pasangan &amp; 2 anak, isi 4.</span>
      </label>

      {/* Sumbangan khas — di dalam borang RSVP */}
      {sumbanganDibuka && (
        <div className="mt-1 rounded-lg border border-surau/30 bg-surau/5 p-3">
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" className="mt-1" checked={nakSumbang} onChange={(e) => setNakSumbang(e.target.checked)} />
            <span>Ingin sekali beri <b>sumbangan khas</b> untuk program ini?</span>
          </label>
          {sumbanganNota && <p className="mt-1 pl-6 text-xs text-slate-500">{sumbanganNota}</p>}

          {nakSumbang && bayaranDibuka && (
            <div className="mt-3 space-y-2 rounded-lg bg-white p-3 text-sm">
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
              <p className="text-center text-[11px] text-slate-500">+ RM1 fi pemprosesan gerbang. Surau terima sumbangan anda penuh.</p>
            </div>
          )}

          {nakSumbang && !bayaranDibuka && (
            <div className="mt-3 rounded-lg bg-white p-3 text-xs text-slate-500">
              Bayaran online sedang diselenggara. Kehadiran anda tetap disahkan — sila salurkan sumbangan ke akaun: <b>{BANK_SURAU.bank}</b> · <b className="font-mono">{BANK_SURAU.no_akaun}</b> · {BANK_SURAU.nama_akaun}.
            </div>
          )}
        </div>
      )}

      {ralat && <p className="text-sm text-red-600">{ralat}</p>}

      <button type="button" onClick={hantar} disabled={sedang} className="rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
        {sedang
          ? "Menyimpan…"
          : nakSumbang && sumbanganDibuka && bayaranDibuka
          ? `Sahkan Kehadiran & Sumbang RM${Number(jumlah) || 0} →`
          : "Sahkan Kehadiran →"}
      </button>

      <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </div>
  );
}
