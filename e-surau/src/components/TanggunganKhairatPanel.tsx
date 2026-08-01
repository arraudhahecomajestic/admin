"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const PER_MUKA = 25;

type Tggn = { nama: string; hubungan: string | null; no_kp: string | null };
type Ahli = { ahli_id: string; nama: string; no_ahli: string | null; telefon: string | null; tanggungan: Tggn[] };

function waNombor(tel: string | null): string {
  let d = (tel || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("60")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d ? "60" + d.slice(0, 10) : "";
}

export default function TanggunganKhairatPanel({ data }: { data: Ahli[] }) {
  const [q, setQ] = useState("");
  const [muka, setMuka] = useState(1);

  const jumTggn = useMemo(() => data.reduce((s, a) => s + a.tanggungan.length, 0), [data]);

  const ditapis = useMemo(() => {
    const cari = q.trim().toLowerCase();
    if (!cari) return data;
    return data.filter((a) =>
      (a.nama || "").toLowerCase().includes(cari) ||
      (a.no_ahli || "").toLowerCase().includes(cari) ||
      (a.telefon || "").includes(cari) ||
      a.tanggungan.some((t) => (t.nama || "").toLowerCase().includes(cari)),
    );
  }, [data, q]);

  useEffect(() => { setMuka(1); }, [q]);
  const jumMuka = Math.max(1, Math.ceil(ditapis.length / PER_MUKA));
  const mukaSemasa = Math.min(muka, jumMuka);
  const halaman = ditapis.slice((mukaSemasa - 1) * PER_MUKA, mukaSemasa * PER_MUKA);

  function muatTurunCsv() {
    const sel = (v: any) => `"${(v ?? "").toString().replace(/"/g, '""')}"`;
    const header = ["No. Ahli", "Nama Ahli", "Telefon", "Nama Tanggungan", "Hubungan", "No. KP Tanggungan"];
    const baris: any[][] = [];
    for (const a of ditapis) {
      if (a.tanggungan.length === 0) baris.push([a.no_ahli, a.nama, a.telefon, "", "", ""]);
      for (const t of a.tanggungan) baris.push([a.no_ahli, a.nama, a.telefon, t.nama, t.hubungan, t.no_kp]);
    }
    const csv = [header, ...baris].map((r) => r.map(sel).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tanggungan-khairat-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-xl bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
        <h2 className="font-semibold text-slate-900">Pendaftaran Tanggungan Khairat</h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">{data.length} ahli</span>
          <span className="rounded-full bg-surau/10 px-2.5 py-0.5 text-xs font-semibold text-surau">{jumTggn} tanggungan</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 py-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Cari nama ahli / tanggungan / no. ahli…"
          className="min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau"
        />
        <button onClick={muatTurunCsv} className="rounded-lg bg-green-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-800">⬇ Muat Turun CSV</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">No. Ahli</th>
              <th className="px-4 py-2">Nama Ahli</th>
              <th className="px-4 py-2">Telefon</th>
              <th className="px-4 py-2">Tanggungan Dilindungi</th>
              <th className="px-4 py-2 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {ditapis.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Tiada kariah mendaftar tanggungan khairat lagi.</td></tr>
            )}
            {halaman.map((a) => {
              const wa = waNombor(a.telefon);
              return (
                <tr key={a.ahli_id} className="border-b align-top last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs">{a.no_ahli || "—"}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{a.nama}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{a.telefon || "—"}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {a.tanggungan.map((t, i) => (
                        <span key={i} className="rounded-lg bg-teal-50 px-2 py-0.5 text-xs text-teal-800">
                          {t.nama}{t.hubungan ? <span className="text-teal-500"> · {t.hubungan}</span> : null}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/permohonan/${a.ahli_id}`} className="rounded-lg bg-surau px-3 py-1.5 text-xs font-semibold text-white hover:bg-surau-dark">Semak / Kemas Kini</Link>
                      {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">WA</a>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {jumMuka > 1 && (
        <div className="flex items-center justify-center gap-3 border-t px-5 py-3">
          <button onClick={() => setMuka((m) => Math.max(1, m - 1))} disabled={mukaSemasa <= 1} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40">← Sebelum</button>
          <span className="text-sm text-slate-500">Muka {mukaSemasa} / {jumMuka}</span>
          <button onClick={() => setMuka((m) => Math.min(jumMuka, m + 1))} disabled={mukaSemasa >= jumMuka} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40">Seterusnya →</button>
        </div>
      )}
    </section>
  );
}
