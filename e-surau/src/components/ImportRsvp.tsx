"use client";

import { useState } from "react";
import { unzipSync, strFromU8 } from "fflate";
import { importRsvp, type BarisRsvp } from "@/app/admin/program/actions";

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

// Pembaca Excel (.xlsx) tempatan guna fflate — tiada pergantungan CDN luar.
// Baca OOXML: unzip → sharedStrings + helaian pertama → grid string[][].
function nyahEntiti(s: string): string {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&");
}
function colIdx(ref: string): number {
  const m = ref.match(/[A-Z]+/);
  if (!m) return 0;
  let n = 0;
  for (const ch of m[0]) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}
async function bacaExcel(fail: File): Promise<string[][]> {
  const buf = new Uint8Array(await fail.arrayBuffer());
  let zip: Record<string, Uint8Array>;
  try {
    zip = unzipSync(buf);
  } catch {
    throw new Error("Fail Excel tidak sah atau rosak. Cuba simpan semula sebagai .xlsx atau muat naik CSV.");
  }

  // sharedStrings.xml → senarai teks
  const shared: string[] = [];
  const sstFile = zip["xl/sharedStrings.xml"];
  if (sstFile) {
    const xml = strFromU8(sstFile);
    for (const si of xml.match(/<si\b[^>]*>[\s\S]*?<\/si>/g) || []) {
      const ts = si.match(/<t[^>]*>[\s\S]*?<\/t>/g) || [];
      shared.push(ts.map((t) => nyahEntiti(t.replace(/<t[^>]*>/, "").replace(/<\/t>/, ""))).join(""));
    }
  }

  // Helaian pertama
  const wsKey =
    Object.keys(zip).find((k) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(k)) ||
    Object.keys(zip).find((k) => /^xl\/worksheets\/.+\.xml$/i.test(k));
  if (!wsKey) throw new Error("Helaian tidak dijumpai dalam fail Excel.");
  const ws = strFromU8(zip[wsKey]);

  const grid: string[][] = [];
  const cellRe = /<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
  for (const row of ws.match(/<row[^>]*>[\s\S]*?<\/row>/g) || []) {
    const cells: Record<number, string> = {};
    let m: RegExpExecArray | null;
    cellRe.lastIndex = 0;
    while ((m = cellRe.exec(row))) {
      const ref = m[1], attrs = m[2] || "", inner = m[3] || "";
      const tM = attrs.match(/t="([^"]+)"/);
      const t = tM ? tM[1] : "";
      let val = "";
      if (t === "inlineStr") {
        const mm = inner.match(/<t[^>]*>([\s\S]*?)<\/t>/);
        val = mm ? nyahEntiti(mm[1]) : "";
      } else {
        const mm = inner.match(/<v>([\s\S]*?)<\/v>/);
        const v = mm ? mm[1] : "";
        if (t === "s") val = v !== "" ? (shared[Number(v)] ?? "") : "";
        else val = nyahEntiti(v);
      }
      cells[colIdx(ref)] = val;
    }
    const keys = Object.keys(cells).map(Number);
    if (keys.length) {
      const maxc = Math.max(...keys);
      const arr: string[] = [];
      for (let i = 0; i <= maxc; i++) arr.push(cells[i] ?? "");
      grid.push(arr);
    } else {
      grid.push([]);
    }
  }
  return grid;
}

// Kesan kolum ikut kata kunci tajuk (fleksibel untuk pelbagai Google Form).
function cariKolum(header: string[]) {
  const h = header.map((x) => (x || "").trim().toLowerCase());
  const cari = (kws: string[], elak: string[] = []) =>
    h.findIndex((c) => kws.some((k) => c.includes(k)) && !elak.some((e) => c.includes(e)));
  const iNama = cari(["nama"]);
  const iTel = cari(["telefon", "phone", "tel", "whatsapp", "wasap", "hp", "no. tel", "no tel"]);
  const iBil = cari(["bil", "bilangan", "orang", "pax", "kehadiran", "jumlah hadir", "berapa"]);
  return { iNama, iTel, iBil };
}

export default function ImportRsvp({ programId }: { programId: string }) {
  const [buka, setBuka] = useState(false);
  const [rows, setRows] = useState<BarisRsvp[]>([]);
  const [namaFail, setNamaFail] = useState("");
  const [ralat, setRalat] = useState("");
  const [proses, setProses] = useState(false);
  const [hasil, setHasil] = useState<null | { ditambah: number; dilangkau: number }>(null);

  function prosesGrid(gridMentah: string[][]) {
    const grid = gridMentah.filter((r) => r.some((x) => (x ?? "").trim() !== ""));
    if (grid.length < 2) { setRalat("Fail kosong atau tiada data selepas tajuk kolum."); return; }
    const header = grid[0];
    const { iNama, iTel, iBil } = cariKolum(header);
    if (iNama < 0) {
      setRalat('Tidak jumpa kolum "Nama". Pastikan baris pertama fail ada tajuk kolum (cth: Nama, No. Telefon, Bilangan).');
      return;
    }
    const out: BarisRsvp[] = [];
    for (let i = 1; i < grid.length; i++) {
      const c = grid[i];
      const nama = (c[iNama] ?? "").trim();
      if (!nama) continue;
      const telefon = iTel >= 0 ? (c[iTel] ?? "").trim() : "";
      const bilRaw = iBil >= 0 ? (c[iBil] ?? "") : "";
      const bil_orang = Math.max(1, Math.floor(parseFloat(String(bilRaw)) || 1));
      out.push({ nama, telefon, bil_orang });
    }
    if (!out.length) { setRalat("Tiada baris nama yang sah dijumpai."); return; }
    setRows(out);
  }

  async function pilihFail(e: React.ChangeEvent<HTMLInputElement>) {
    setHasil(null); setRalat(""); setRows([]);
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

  async function sahkan() {
    setProses(true); setRalat(""); setHasil(null);
    const res = await importRsvp(programId, rows);
    setProses(false);
    if (!res.ok) { setRalat(res.msg || "Ralat import."); return; }
    setHasil({ ditambah: res.ditambah ?? 0, dilangkau: res.dilangkau ?? 0 });
    setRows([]); setNamaFail("");
  }

  const totOrang = rows.reduce((s, r) => s + (Number(r.bil_orang) || 1), 0);

  return (
    <div className="border-t px-5 py-4">
      <button onClick={() => setBuka((v) => !v)} className="flex w-full items-center justify-between text-left">
        <span className="text-sm font-semibold text-slate-800">Import Senarai RSVP (Excel / CSV / Google Form)</span>
        <span className="text-sm text-surau">{buka ? "Tutup ▲" : "Buka ▼"}</span>
      </button>

      {buka && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-slate-500">
            Muat naik fail eksport Google Form / Excel. Sistem kesan kolum <b>Nama</b>, <b>Telefon</b> &amp; <b>Bilangan</b> secara automatik.
            Nama + telefon yang sudah wujud akan <b>dilangkau</b> (elak tally berganda).
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded-lg bg-surau px-4 py-2 text-sm font-semibold text-white hover:bg-surau-dark">
              Pilih Fail
              <input type="file" accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={pilihFail} />
            </label>
            {namaFail && <span className="text-sm text-slate-500">{namaFail}</span>}
          </div>

          {ralat && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{ralat}</div>}

          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-lg bg-surau/10 px-3 py-1 font-semibold text-surau">{rows.length} baris</span>
                <span className="rounded-lg bg-green-100 px-3 py-1 font-semibold text-green-700">{totOrang} orang</span>
                <span className="self-center text-slate-400">Duplikat akan dilangkau semasa import.</span>
              </div>
              <div className="max-h-72 overflow-auto rounded-lg border">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-slate-500"><tr><th className="px-2 py-1.5">#</th><th className="px-2 py-1.5">Nama</th><th className="px-2 py-1.5">Telefon</th><th className="px-2 py-1.5 text-center">Bil.</th></tr></thead>
                  <tbody>
                    {rows.slice(0, 300).map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1 text-slate-400">{i + 1}</td>
                        <td className="px-2 py-1 text-slate-800">{r.nama}</td>
                        <td className="px-2 py-1 text-slate-600">{r.telefon || "—"}</td>
                        <td className="px-2 py-1 text-center">{r.bil_orang}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 300 && <p className="text-xs text-slate-400">Pratonton 300 pertama; semua {rows.length} akan diproses.</p>}
              <button onClick={sahkan} disabled={proses} className="rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
                {proses ? "Mengimport…" : `Sahkan & Import ${rows.length} baris`}
              </button>
            </div>
          )}

          {hasil && (
            <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-800">
              <div className="font-bold">✓ Import selesai</div>
              <div className="mt-1"><b>{hasil.ditambah}</b> ditambah ke senarai · <b>{hasil.dilangkau}</b> dilangkau (duplikat / tiada nama).</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
