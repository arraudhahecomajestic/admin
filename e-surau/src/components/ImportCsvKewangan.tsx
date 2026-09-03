"use client";

import { useMemo, useState } from "react";
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
  return baris;
}

const BULAN: Record<string, string> = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", mei: "05", jun: "06", jul: "07", aug: "08", ogo: "08", sep: "09", oct: "10", okt: "10", nov: "11", dec: "12", dis: "12" };
function parseTarikhBank(s: string): string | null {
  const t = (s || "").replace(/\s+/g, " ").trim();
  const m = t.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (m) { const mo = BULAN[m[2].slice(0, 3).toLowerCase()]; if (mo) return `${m[3]}-${mo}-${m[1].padStart(2, "0")}`; }
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const d = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (d) return `${d[3]}-${d[2].padStart(2, "0")}-${d[1].padStart(2, "0")}`;
  return null;
}
const duit = (s: string) => Number(String(s || "").replace(/[^0-9.]/g, "")) || 0;

// Muat SheetJS (xlsx) dari cdnjs sekali sahaja — hanya bila fail Excel dipilih.
let xlsxJanji: Promise<any> | null = null;
function muatXLSX(): Promise<any> {
  if (typeof window !== "undefined" && (window as any).XLSX) return Promise.resolve((window as any).XLSX);
  if (xlsxJanji) return xlsxJanji;
  xlsxJanji = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.async = true;
    s.onload = () => resolve((window as any).XLSX);
    s.onerror = () => { xlsxJanji = null; reject(new Error("Gagal memuat pembaca Excel.")); };
    document.head.appendChild(s);
  });
  return xlsxJanji;
}

// Fail Excel → grid string[][] (guna helaian pertama).
async function bacaExcel(fail: File): Promise<string[][]> {
  const XLSX = await muatXLSX();
  const buf = await fail.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const grid: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
  return grid.map((r) => (r || []).map((c: any) => (c == null ? "" : String(c))));
}

function kategoriMasuk(teks: string): string {
  const t = teks.toLowerCase();
  if (t.includes("khairat")) return "Yuran Khairat";
  if (t.includes("wakaf")) return "Wakaf";
  if (t.includes("subuh")) return "Infaq Subuh";
  if (t.includes("tahlil") || t.includes("yassin") || t.includes("jamuan")) return "Sumbangan Jamuan / Tahlil";
  return "Infaq / Derma";
}
function kategoriKeluar(teks: string): string {
  const t = teks.toLowerCase();
  if (/(kuliah|khatib|bilal|imam|petugas|pps|elaun|upah|gaji)/.test(t)) return "Elaun / Upah";
  if (/(jamuan|pantry|meals|makan|minum|air tin|jamu)/.test(t)) return "Program / Aktiviti";
  if (/(alat tulis|gerobok|kabinet|peralatan|beli|pembelian)/.test(t)) return "Peralatan";
  if (/(elektrik|utiliti|bil |tnb|air bil)/.test(t)) return "Utiliti (air/elektrik)";
  if (/(selenggara|baik pulih|repair|servis|service)/.test(t)) return "Penyelenggaraan";
  return "Lain-lain";
}

// Kesan & huraikan penyata Maybank → BarisCsv[] individu
function parseMaybank(grid: string[][]): BarisCsv[] | null {
  let hi = -1;
  for (let i = 0; i < Math.min(grid.length, 15); i++) {
    const rowL = grid[i].map((c) => c.trim().toLowerCase());
    if (rowL.some((c) => c.includes("transaction date")) && rowL.some((c) => c.includes("cash-in") || c.includes("cash in"))) { hi = i; break; }
  }
  if (hi < 0) return null;
  const H = grid[hi].map((c) => c.trim().toLowerCase());
  const find = (kw: string) => H.findIndex((c) => c.includes(kw));
  const iDate = find("transaction date");
  const iD1 = find("description 1");
  const iD2 = find("description 2");
  const iBen = find("beneficiary");
  const iIn = H.findIndex((c) => c.includes("cash-in") || c.includes("cash in"));
  const iOut = H.findIndex((c) => c.includes("cash-out") || c.includes("cash out"));
  const keluar: BarisCsv[] = [];
  const out: BarisCsv[] = [];
  for (let i = hi + 1; i < grid.length; i++) {
    const c = grid[i];
    const tarikh = parseTarikhBank(c[iDate] ?? "");
    if (!tarikh) continue;
    const masukAmt = iIn >= 0 ? duit(c[iIn]) : 0;
    const keluarAmt = iOut >= 0 ? duit(c[iOut]) : 0;
    if (masukAmt <= 0 && keluarAmt <= 0) continue;
    const d1 = (c[iD1] ?? "").trim(), d2 = (c[iD2] ?? "").trim(), ben = (c[iBen] ?? "").replace(/\*+$/, "").trim();
    const bahan = [d1, d2, ben].filter((x) => x && !/^\d{6,}$/.test(x) && x !== "DUITNOW QR-" && x !== "MBB CT-" && x !== "MBB CT").join(" · ");
    const teksKat = [d1, d2, ben].join(" ");
    if (masukAmt > 0) out.push({ jenis: "Masuk", tarikh, kategori: kategoriMasuk(teksKat), jumlah: masukAmt, keterangan: bahan || ben || "DuitNow", kaedah: "online" });
    else out.push({ jenis: "Keluar", tarikh, kategori: kategoriKeluar(teksKat), jumlah: keluarAmt, keterangan: bahan || ben || "Perbelanjaan", kaedah: "online" });
  }
  void keluar;
  return out;
}

// Ringkaskan kutipan Masuk ikut (tarikh + kategori); Keluar kekal individu
function ringkaskan(rows: BarisCsv[]): BarisCsv[] {
  const peta = new Map<string, { r: BarisCsv; n: number; jum: number }>();
  const keluar: BarisCsv[] = [];
  for (const r of rows) {
    if (String(r.jenis).toLowerCase() === "masuk") {
      const key = `${r.tarikh}||${r.kategori}`;
      const ada = peta.get(key);
      if (ada) { ada.jum += Number(r.jumlah) || 0; ada.n++; }
      else peta.set(key, { r: { ...r }, n: 1, jum: Number(r.jumlah) || 0 });
    } else keluar.push(r);
  }
  const masuk = Array.from(peta.values()).map((v) => ({ ...v.r, jumlah: Number(v.jum.toFixed(2)), keterangan: `${v.r.kategori} — ${v.n} transaksi` }));
  return [...masuk, ...keluar];
}

export default function ImportCsvKewangan() {
  const [rawRows, setRawRows] = useState<BarisCsv[]>([]);
  const [format, setFormat] = useState<"" | "maybank" | "templat">("");
  const [ringkas, setRingkas] = useState(true);
  const [namaFail, setNamaFail] = useState("");
  const [proses, setProses] = useState(false);
  const [hasil, setHasil] = useState<any>(null);
  const [ralat, setRalat] = useState("");
  const [buka, setBuka] = useState(false);

  const rows = useMemo(() => (format === "maybank" && ringkas ? ringkaskan(rawRows) : rawRows), [rawRows, ringkas, format]);

  // Proses grid (dari CSV atau Excel) → kesan format & isi jadual pratonton.
  function prosesGrid(gridMentah: string[][]) {
    const grid = gridMentah.filter((r) => r.some((x) => (x ?? "").trim() !== ""));
    if (grid.length < 2) { setRalat("Fail kosong atau tiada data."); return; }

    // Cuba format Maybank dahulu
    const mb = parseMaybank(grid);
    if (mb && mb.length) { setFormat("maybank"); setRawRows(mb); return; }

    // Fallback: templat sendiri
    const header = grid[0].map((h) => h.trim().toLowerCase());
    const idx = (n: string[]) => header.findIndex((h) => n.includes(h));
    const iJenis = idx(["jenis", "type"]), iTarikh = idx(["tarikh", "date"]), iKat = idx(["kategori", "category"]), iJum = idx(["jumlah", "amount", "rm"]), iKet = idx(["keterangan", "catatan", "description", "butiran"]), iKae = idx(["kaedah", "method", "cara"]);
    if (iJenis < 0 || iTarikh < 0 || iKat < 0 || iJum < 0) { setFormat(""); setRalat("Format tidak dikenali. Guna templat kami (Jenis, Tarikh, Kategori, Jumlah, Keterangan, Kaedah), atau muat naik penyata Maybank."); return; }
    setFormat("templat");
    setRawRows(grid.slice(1).map((c) => ({ jenis: c[iJenis] ?? "", tarikh: c[iTarikh] ?? "", kategori: c[iKat] ?? "", jumlah: c[iJum] ?? "", keterangan: iKet >= 0 ? c[iKet] ?? "" : "", kaedah: iKae >= 0 ? c[iKae] ?? "" : "" })));
  }

  async function pilihFail(e: React.ChangeEvent<HTMLInputElement>) {
    setHasil(null); setRalat(""); setRawRows([]); setFormat("");
    const fail = e.target.files?.[0];
    if (!fail) return;
    setNamaFail(fail.name);
    const excel = /\.(xlsx|xls)$/i.test(fail.name);
    try {
      const grid = excel ? await bacaExcel(fail) : parseCsv(await fail.text());
      prosesGrid(grid);
    } catch (err: any) {
      setRalat(err?.message || "Gagal membaca fail. Pastikan ia fail Excel (.xlsx) atau CSV yang sah.");
    } finally {
      e.target.value = "";
    }
  }

  const isMasukRow = (r: BarisCsv) => ["masuk", "income", "in", "kutipan"].includes(String(r.jenis).trim().toLowerCase());
  const totMasuk = rows.filter(isMasukRow).reduce((s, r) => s + (Number(String(r.jumlah).replace(/[^0-9.]/g, "")) || 0), 0);
  const totKeluar = rows.filter((r) => !isMasukRow(r)).reduce((s, r) => s + (Number(String(r.jumlah).replace(/[^0-9.]/g, "")) || 0), 0);

  async function sahkan() {
    setProses(true); setHasil(null); setRalat("");
    const res = await importKewanganCsv(rows);
    setProses(false);
    if (!res.ok) { setRalat(res.msg || "Ralat import."); return; }
    setHasil(res); setRawRows([]); setNamaFail(""); setFormat("");
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <button onClick={() => setBuka((v) => !v)} className="flex w-full items-center justify-between text-left">
        <h2 className="font-semibold text-slate-900">Muat Naik Laporan Kewangan Bulanan</h2>
        <span className="text-sm text-surau">{buka ? "Tutup ▲" : "Buka ▼"}</span>
      </button>

      {buka && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-600">
            Muat naik fail <b>laporan kewangan bulanan</b> (Excel .xlsx). Sistem akan baca fail dan kemas kini carta kewangan secara automatik.
          </p>
          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-lg bg-surau px-4 py-2 text-sm font-semibold text-white hover:bg-surau-dark">
              Upload Laporan
              <input type="file" accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={pilihFail} />
            </label>
            {namaFail && <span className="self-center text-sm text-slate-500">{namaFail}{format === "maybank" ? " · Penyata Maybank dikesan" : ""}</span>}
          </div>

          {ralat && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{ralat}</div>}

          {rawRows.length > 0 && (
            <div className="space-y-3">
              {format === "maybank" && (
                <label className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  <input type="checkbox" checked={ringkas} onChange={(e) => setRingkas(e.target.checked)} />
                  <span>Ringkaskan kutipan kecil jadi jumlah harian ikut kategori <b>(disyorkan)</b> — {rawRows.length} transaksi → {rows.length} rekod.</span>
                </label>
              )}
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-lg bg-green-100 px-3 py-1 font-semibold text-green-700">Masuk: RM{totMasuk.toFixed(2)}</span>
                <span className="rounded-lg bg-red-100 px-3 py-1 font-semibold text-red-700">Keluar: RM{totKeluar.toFixed(2)}</span>
                <span className="rounded-lg bg-slate-100 px-3 py-1 font-semibold text-slate-700">Baki: RM{(totMasuk - totKeluar).toFixed(2)}</span>
                <span className="self-center text-slate-400">{rows.length} rekod akan diimport</span>
              </div>
              <div className="max-h-80 overflow-auto rounded-lg border">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-slate-500"><tr><th className="px-2 py-1.5">Jenis</th><th className="px-2 py-1.5">Tarikh</th><th className="px-2 py-1.5">Kategori</th><th className="px-2 py-1.5 text-right">Jumlah</th><th className="px-2 py-1.5">Keterangan</th></tr></thead>
                  <tbody>
                    {rows.slice(0, 300).map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1"><span className={isMasukRow(r) ? "text-green-700" : "text-red-700"}>{isMasukRow(r) ? "Masuk" : "Keluar"}</span></td>
                        <td className="px-2 py-1">{r.tarikh}</td>
                        <td className="px-2 py-1">{r.kategori}</td>
                        <td className="px-2 py-1 text-right">{Number(String(r.jumlah).replace(/[^0-9.]/g, "")).toFixed(2)}</td>
                        <td className="px-2 py-1 text-slate-500">{r.keterangan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 300 && <p className="text-xs text-slate-400">Pratonton 300 pertama; semua {rows.length} akan diimport.</p>}
              <button onClick={sahkan} disabled={proses} className="rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
                {proses ? "Mengimport…" : `Sahkan & Import ${rows.length} rekod`}
              </button>
              <p className="text-xs text-slate-400">Semak jadual dahulu. Kategori auto-dicadang ikut keterangan — betulkan dalam rekod selepas import jika perlu. Kategori baru dicipta automatik.</p>
            </div>
          )}

          {hasil && (
            <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-800">
              <div className="font-bold">✓ Import selesai</div>
              <div className="mt-1">Masuk: <b>{hasil.masuk}</b> rekod (RM{Number(hasil.jumMasuk).toFixed(2)}) · Keluar: <b>{hasil.keluar}</b> rekod (RM{Number(hasil.jumKeluar).toFixed(2)})</div>
              {hasil.dilangkau > 0 && (
                <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-amber-800">
                  <b>{hasil.dilangkau} baris dilangkau</b> kerana sudah wujud dalam sistem (elak berganda).
                  {hasil.masuk === 0 && hasil.keluar === 0 && <> Nampaknya fail ini sudah diimport sebelum ini — tiada rekod baharu ditambah.</>}
                </div>
              )}
              {hasil.gagal > 0 && (<div className="mt-2 text-red-700"><b>{hasil.gagal} baris gagal:</b><ul className="mt-1 list-disc pl-5">{hasil.ralat.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></div>)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
