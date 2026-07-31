"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Ahli = {
  id: string;
  no_ahli: string | null;
  nama: string;
  no_kp: string | null;
  telefon: string | null;
  status: "menunggu" | "lulus" | "tolak";
  maklumat_disahkan: boolean;
  sumber: string;
};

type Tab = "semua" | "baru" | "belum" | "sah";

function topengKp(kp: string | null): string {
  const d = (kp || "").replace(/\s/g, "");
  if (!d) return "—";
  return d.length <= 4 ? "••••" : "•".repeat(d.length - 4) + d.slice(-4);
}
function topengTel(tel: string | null): string {
  const d = (tel || "").trim();
  if (!d) return "—";
  return d.length <= 3 ? "•••" : "•".repeat(d.length - 3) + d.slice(-3);
}
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

export default function PengurusanAhli({ senarai, bolehPapar }: { senarai: Ahli[]; bolehPapar: boolean }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("semua");
  const [papar, setPapar] = useState(false);
  const [disalin, setDisalin] = useState(false);

  const kira = useMemo(() => ({
    jumlah: senarai.length,
    menunggu: senarai.filter((a) => a.status === "menunggu").length,
    lulus: senarai.filter((a) => a.status === "lulus").length,
    belum: senarai.filter((a) => !a.maklumat_disahkan).length,
    baru: senarai.filter((a) => a.sumber === "baru").length,
    sah: senarai.filter((a) => a.maklumat_disahkan).length,
  }), [senarai]);

  const ditapis = useMemo(() => {
    const cari = q.trim().toLowerCase();
    return senarai.filter((a) => {
      if (tab === "baru" && a.sumber !== "baru") return false;
      if (tab === "belum" && a.maklumat_disahkan) return false;
      if (tab === "sah" && !a.maklumat_disahkan) return false;
      if (!cari) return true;
      return (
        (a.nama || "").toLowerCase().includes(cari) ||
        (a.no_ahli || "").toLowerCase().includes(cari) ||
        (a.no_kp || "").includes(cari) ||
        (a.telefon || "").includes(cari)
      );
    });
  }, [senarai, q, tab]);

  function salin() {
    const teks = ditapis.map((a) => `${a.nama}\t${a.telefon ?? "-"}\t${a.maklumat_disahkan ? "Disahkan" : "Belum"}`).join("\n");
    navigator.clipboard?.writeText(teks).then(() => { setDisalin(true); setTimeout(() => setDisalin(false), 2000); });
  }

  function muatTurunCsv() {
    const kelulusan = (s: string) => (s === "lulus" ? "Diluluskan" : s === "tolak" ? "Ditolak" : "Menunggu");
    const sel = (v: any) => {
      const s = (v ?? "").toString().replace(/"/g, '""');
      return `"${s}"`;
    };
    const header = ["No. Ahli", "Nama", "No. KP", "Telefon", "Kelulusan", "Data"];
    const baris = ditapis.map((a) => [
      a.no_ahli, a.nama, a.no_kp, a.telefon,
      kelulusan(a.status), a.maklumat_disahkan ? "Disahkan" : "Belum",
    ]);
    const csv = [header, ...baris].map((r) => r.map(sel).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const tarikh = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `ahli-kariah-${tarikh}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const bolehLihat = bolehPapar && papar;

  return (
    <div className="space-y-5">
      {/* KAD RINGKASAN */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kad label="Jumlah Ahli" nilai={kira.jumlah} warna="text-slate-900" />
        <Kad label="Menunggu Kelulusan" nilai={kira.menunggu} warna="text-amber-600" />
        <Kad label="Diluluskan" nilai={kira.lulus} warna="text-green-600" />
        <Kad label="Belum Kemas Kini" nilai={kira.belum} warna="text-orange-600" />
      </div>

      {/* KAWALAN */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Cari nama, no. ahli, IC atau telefon…"
          className="min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau"
        />
        {bolehPapar && (
          <button
            onClick={() => setPapar((v) => !v)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${papar ? "bg-amber-500 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-100"}`}
            title="Papar / sorok No. KP & telefon (Admin sahaja)"
          >
            {papar ? "🙈 Sorok IC & Telefon" : "👁 Papar IC & Telefon"}
          </button>
        )}
        <button onClick={salin} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          {disalin ? "✓ Disalin" : "Salin senarai"}
        </button>
        {bolehPapar && (
          <button onClick={muatTurunCsv} className="rounded-lg bg-green-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-800">
            ⬇ Muat Turun CSV
          </button>
        )}
      </div>

      {/* TAB */}
      <div className="flex flex-wrap gap-2">
        <TabBtn label="Semua" bil={kira.jumlah} aktif={tab === "semua"} onClick={() => setTab("semua")} warna="bg-slate-700" />
        <TabBtn label="Pemohon Baru" bil={kira.baru} aktif={tab === "baru"} onClick={() => setTab("baru")} warna="bg-emerald-600" />
        <TabBtn label="Belum Kemas Kini" bil={kira.belum} aktif={tab === "belum"} onClick={() => setTab("belum")} warna="bg-orange-500" />
        <TabBtn label="Dah Sahkan" bil={kira.sah} aktif={tab === "sah"} onClick={() => setTab("sah")} warna="bg-green-600" />
      </div>

      <div className="text-xs text-slate-500">Menunjukkan {ditapis.length} rekod.</div>

      {/* JADUAL */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">No. Ahli</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Telefon</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {ditapis.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Tiada rekod padan.</td></tr>
            )}
            {ditapis.slice(0, 800).map((a) => {
              const wa = waNombor(a.telefon);
              return (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs">{a.no_ahli}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-900">{a.nama}</div>
                    <div className="font-mono text-xs text-slate-400">{bolehLihat ? (a.no_kp || "—") : topengKp(a.no_kp)}</div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{bolehLihat ? (a.telefon || "—") : topengTel(a.telefon)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      <LencanaKelulusan status={a.status} />
                      {a.maklumat_disahkan
                        ? <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700">Data ✓</span>
                        : <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-700">Data belum</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/permohonan/${a.id}`} className="rounded-lg bg-surau px-3 py-1.5 text-xs font-semibold text-white hover:bg-surau-dark">Semak</Link>
                      {wa
                        ? <a href={`https://wa.me/${wa}?text=${encodeURIComponent(PESANAN)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">WhatsApp</a>
                        : <span className="text-xs text-slate-300">—</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {ditapis.length > 800 && <div className="text-xs text-slate-400">Memaparkan 800 pertama. Gunakan carian untuk tapis lagi.</div>}
    </div>
  );
}

function LencanaKelulusan({ status }: { status: string }) {
  if (status === "lulus") return <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700">Diluluskan</span>;
  if (status === "tolak") return <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700">Ditolak</span>;
  return <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">Menunggu</span>;
}

function Kad({ label, nilai, warna }: { label: string; nilai: number; warna: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className={`text-2xl font-bold ${warna}`}>{nilai}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
function TabBtn({ label, bil, aktif, onClick, warna }: { label: string; bil: number; aktif: boolean; onClick: () => void; warna: string }) {
  return (
    <button onClick={onClick} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${aktif ? `${warna} text-white` : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
      {label} <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${aktif ? "bg-white/25" : "bg-white"}`}>{bil}</span>
    </button>
  );
}
