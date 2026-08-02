"use client";

import { useState } from "react";
import { importKewanganCsv, type BarisCsv } from "@/app/admin/kewangan/actions";

// Parser CSV ringkas — sokong medan berpetik & koma dalam petikan.
function parseCsv(teks: string): string[][] {
  const baris: string[][] = [];
  let row: string[] = [], cur = "", inQ = false;
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (inQ) {
      if (c === '"') { if (teks[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n") { row.push(cur); baris.push(row); row = []; cur = ""; }
      else if (c === "\r") { /* abai */ }
      else cur += c;
    }
  }
  if (cur.length || row.length) { row.push(cur); baris.push(row); }
  return baris.filter((r) => r.some((x) => (x ?? "").trim() !== ""));
}

const TEMPLAT = `Jenis,Tarikh,Kategori,Jumlah,Keterangan,Kaedah
Masuk,2026-07-05,Infaq / Derma,150.00,Tabung Jumaat,tunai
Masuk,2026-07-12,Wakaf,300.00,Wakaf Ahli,online
Keluar,2026-07-15,Utiliti (air/elektrik),220.50,Bil elektrik Julai,
Keluar,2026-07-20,Penyelenggaraan,80.00,Baik pulih paip,`;

export default function ImportCsvKewangan() {
  const [rows, setRows] = useState<BarisCsv[]>([]);
  const [namaFail, setNamaFail] = useState("");
  const [proses, setProses] = useState(false);
  const [hasil, setHasil] = useState<any>(null);
  const [ralat, setRalat] = useState("");
  const [buka, setBuka] = useState(false);

  function muatTemplat() {
    const blob = new Blob(["﻿" + TEMPLAT], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "templat-kewangan-bulanan.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  async function pilihFail(e: React.ChangeEvent<HTMLInputElement>) {
    setHasil(null); setRalat("");
    const fail = e.target.files?.[0];
    if (!fail) return;
    setNamaFail(fail.name);
    const teks = await fail.text();
    const grid = parseCsv(teks);
    if (grid.length < 2) { setRalat("Fail tiada baris data."); setRows([]); return; }
    const header = grid[0].map((h) => h.trim().toLowerCase());
    const idx = (nama: string[]) => header.findIndex((h) => nama.includes(h));
    const iJenis = idx(["jenis", "type"]);
    const iTarikh = idx(["tarikh", "date"]);
    const iKat = idx(["kategori", "category"]);
    const iJum = idx(["jumlah", "amount", "rm"]);
    const iKet = idx(["keterangan", "catatan", "description", "butiran"]);
    const iKae = idx(["kaedah", "method", "cara"]);
    if (iJenis < 0 || iTarikh < 0 || iKat < 0 || iJum < 0) {
      setRalat("Tajuk lajur tidak lengkap. Perlu: Jenis, Tarikh, Kategori, Jumlah. Sila guna templat."); setRows([]); return;
    }
    const parsed: BarisCsv[] = grid.slice(1).map((c) => ({
      jenis: c[iJenis] ?? "", tarikh: c[iTarikh] ?? "", kategori: c[iKat] ?? "",
      jumlah: c[iJum] ?? "", keterangan: iKet >= 0 ? c[iKet] ?? "" : "", kaedah: iKae >= 0 ? c[iKae] ?? "" : "",
    }));
    setRows(parsed);
  }

  const totMasuk = rows.filter((r) => ["masuk", "income", "in", "kutipan"].includes(String(r.jenis).trim().toLowerCase())).reduce((s, r) => s + (Number(String(r.jumlah).replace(/[^0-9.\-]/g, "")) || 0), 0);
  const totKeluar = rows.filter((r) => ["keluar", "expense", "out", "belanja"].includes(String(r.jenis).trim().toLowerCase())).reduce((s, r) => s + (Number(String(r.jumlah).replace(/[^0-9.\-]/g, "")) || 0), 0);

  async function sahkan() {
    setProses(true); setHasil(null); setRalat("");
    const res = await importKewanganCsv(rows);
    setProses(false);
    if (!res.ok) { setRalat(res.msg || "Ralat import."); return; }
    setHasil(res); setRows([]); setNamaFail("");
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <button onClick={() => setBuka((v) => !v)} className="flex w-full items-center justify-between text-left">
        <h2 className="font-semibold text-slate-900">⬆️ Import Kewangan Bulanan (CSV)</h2>
        <span className="text-sm text-surau">{buka ? "Tutup ▲" : "Buka ▼"}</span>
      </button>

      {buka && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-600">
            Muat naik satu fail CSV untuk sebulan — sistem akan kemas kini <b>kutipan (Masuk)</b> & <b>perbelanjaan (Keluar)</b> secara automatik.
            Lajur: <code className="rounded bg-slate-100 px-1">Jenis, Tarikh, Kategori, Jumlah, Keterangan, Kaedah</code>. Jenis = <b>Masuk</b> atau <b>Keluar</b>.
          </p>

          <div className="flex flex-wrap gap-2">
            <button onClick={muatTemplat} className="rounded-lg border border-surau/40 px-3 py-2 text-sm font-semibold text-surau hover:bg-surau/5">⬇ Muat Turun Templat CSV</button>
            <label className="cursor-pointer rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
              📁 Pilih Fail CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={pilihFail} />
            </label>
            {namaFail && <span className="self-center text-sm text-slate-500">{namaFail} — {rows.length} baris</span>}
          </div>

          {ralat && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{ralat}</div>}

          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-lg bg-green-100 px-3 py-1 font-semibold text-green-700">Masuk: RM{totMasuk.toFixed(2)}</span>
                <span className="rounded-lg bg-red-100 px-3 py-1 font-semibold text-red-700">Keluar: RM{totKeluar.toFixed(2)}</span>
                <span className="rounded-lg bg-slate-100 px-3 py-1 font-semibold text-slate-700">Baki: RM{(totMasuk - totKeluar).toFixed(2)}</span>
              </div>
              <div className="max-h-72 overflow-auto rounded-lg border">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-slate-500">
                    <tr><th className="px-2 py-1.5">Jenis</th><th className="px-2 py-1.5">Tarikh</th><th className="px-2 py-1.5">Kategori</th><th className="px-2 py-1.5 text-right">Jumlah</th><th className="px-2 py-1.5">Keterangan</th></tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 200).map((r, i) => {
                      const masuk = ["masuk", "income", "in", "kutipan"].includes(String(r.jenis).trim().toLowerCase());
                      return (
                        <tr key={i} className="border-t">
                          <td className="px-2 py-1"><span className={masuk ? "text-green-700" : "text-red-700"}>{r.jenis}</span></td>
                          <td className="px-2 py-1">{r.tarikh}</td>
                          <td className="px-2 py-1">{r.kategori}</td>
                          <td className="px-2 py-1 text-right">{r.jumlah}</td>
                          <td className="px-2 py-1 text-slate-500">{r.keterangan}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button onClick={sahkan} disabled={proses} className="rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
                {proses ? "Mengimport…" : `Sahkan & Import ${rows.length} baris`}
              </button>
              <p className="text-xs text-slate-400">Semak dulu jadual di atas sebelum sahkan. Kategori baru akan dicipta automatik jika belum wujud.</p>
            </div>
          )}

          {hasil && (
            <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-800">
              <div className="font-bold">✓ Import selesai</div>
              <div className="mt-1">Masuk: <b>{hasil.masuk}</b> rekod (RM{Number(hasil.jumMasuk).toFixed(2)}) · Keluar: <b>{hasil.keluar}</b> rekod (RM{Number(hasil.jumKeluar).toFixed(2)})</div>
              {hasil.gagal > 0 && (
                <div className="mt-2 text-red-700">
                  <b>{hasil.gagal} baris gagal:</b>
                  <ul className="mt-1 list-disc pl-5">{hasil.ralat.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
