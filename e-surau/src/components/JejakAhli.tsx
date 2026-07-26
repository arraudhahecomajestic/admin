"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Ahli = {
  id: string;
  no_ahli: string | null;
  nama: string;
  no_kp: string | null;
  telefon: string | null;
  maklumat_disahkan: boolean;
  tarikh_kemaskini: string | null;
};

type Tapis = "semua" | "disahkan" | "belum";

// Nombor telefon Malaysia → format antarabangsa untuk wa.me
function waNombor(tel: string | null): string {
  let d = (tel || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("60")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d ? "60" + d.slice(0, 10) : "";
}

const PESANAN =
  "Assalamualaikum, ini peringatan dari Surau Ar Raudhah, Eco Majestic. " +
  "Sila kemas kini & sahkan maklumat kariah anda di https://arraudhahecomajestic.com — " +
  "log masuk guna emel & No. Kad Pengenalan anda. Terima kasih.";

export default function JejakAhli({ senarai }: { senarai: Ahli[] }) {
  const [q, setQ] = useState("");
  const [tapis, setTapis] = useState<Tapis>("semua");
  const [disalin, setDisalin] = useState(false);

  const jumDisahkan = useMemo(() => senarai.filter((a) => a.maklumat_disahkan).length, [senarai]);
  const total = senarai.length;
  const pct = total ? Math.round((jumDisahkan / total) * 100) : 0;

  const ditapis = useMemo(() => {
    const cari = q.trim().toLowerCase();
    return senarai.filter((a) => {
      if (tapis === "disahkan" && !a.maklumat_disahkan) return false;
      if (tapis === "belum" && a.maklumat_disahkan) return false;
      if (!cari) return true;
      return (
        (a.nama || "").toLowerCase().includes(cari) ||
        (a.no_ahli || "").toLowerCase().includes(cari) ||
        (a.no_kp || "").includes(cari) ||
        (a.telefon || "").includes(cari)
      );
    });
  }, [senarai, q, tapis]);

  function salinSenarai() {
    const teks = ditapis
      .map((a) => `${a.nama}\t${a.telefon ?? "-"}\t${a.maklumat_disahkan ? "Disahkan" : "Belum"}`)
      .join("\n");
    navigator.clipboard?.writeText(teks).then(() => {
      setDisalin(true);
      setTimeout(() => setDisalin(false), 2000);
    });
  }

  const btn = (t: Tapis, label: string, warna: string) => (
    <button
      onClick={() => setTapis(t)}
      className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
        tapis === t ? warna : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Ringkasan progress */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {jumDisahkan} / {total}
            </div>
            <div className="text-sm text-slate-500">ahli telah kemas kini & sahkan maklumat</div>
          </div>
          <div className="text-3xl font-bold text-surau">{pct}%</div>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-surau transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Carian + tapisan */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Cari nama, no. ahli, IC atau telefon…"
          className="min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau"
        />
        {btn("semua", `Semua (${total})`, "bg-slate-700 text-white")}
        {btn("belum", `Belum (${total - jumDisahkan})`, "bg-orange-500 text-white")}
        {btn("disahkan", `Disahkan (${jumDisahkan})`, "bg-green-600 text-white")}
        <button
          onClick={salinSenarai}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          {disalin ? "✓ Disalin" : "Salin senarai"}
        </button>
      </div>

      <div className="text-xs text-slate-500">Menunjukkan {ditapis.length} rekod.</div>

      {/* Senarai */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">No. Ahli</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Telefon</th>
              <th className="px-4 py-3">Maklumat</th>
              <th className="px-4 py-3">Butiran</th>
              <th className="px-4 py-3 text-right">Peringatan</th>
            </tr>
          </thead>
          <tbody>
            {ditapis.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">Tiada rekod padan.</td>
              </tr>
            )}
            {ditapis.slice(0, 600).map((a) => {
              const wa = waNombor(a.telefon);
              return (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">{a.no_ahli}</td>
                  <td className="px-4 py-2">
                    <div className="font-medium text-slate-900">{a.nama}</div>
                    <div className="text-xs text-slate-400">{a.no_kp}</div>
                  </td>
                  <td className="px-4 py-2">{a.telefon || "—"}</td>
                  <td className="px-4 py-2">
                    {a.maklumat_disahkan ? (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Disahkan</span>
                    ) : (
                      <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">Belum</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/admin/permohonan/${a.id}`} className="rounded-lg bg-surau px-3 py-1.5 text-xs font-semibold text-white hover:bg-surau-dark">
                      Semak →
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {wa ? (
                      <a
                        href={`https://wa.me/${wa}?text=${encodeURIComponent(PESANAN)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        WhatsApp
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Tiada no.</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {ditapis.length > 600 && (
        <div className="text-xs text-slate-400">Memaparkan 600 pertama. Gunakan carian untuk tapis lagi.</div>
      )}
    </div>
  );
}
