"use client";

import { useState } from "react";
import { rm } from "@/lib/format";

type Baris = { nama: string; jumlah: number };
type Props = {
  tahun: number;
  nama: string;
  bulanAda: number[];
  dataBulan: Record<number, { masuk: Baris[]; keluar: Baris[] }>;
  tahunMasuk: number[];
  tahunKeluar: number[];
  pratonton?: boolean;
};

const BULAN_PENUH = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
const BULAN_PENDEK = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogos", "Sep", "Okt", "Nov", "Dis"];
const PAL = ["#2563a8", "#c26b32", "#2e8b6b", "#c9a227", "#8a5a9e", "#5f7280", "#6f9a3a", "#b0483a", "#3f7d9a", "#a06a3a", "#6b7f2a", "#94566b"];
const HIJAU = "#2e8b6b";
const OREN = "#c26b32";

function Donut({ rows }: { rows: Baris[] }) {
  const total = rows.reduce((s, r) => s + r.jumlah, 0);
  if (!total) return <div className="flex h-[240px] items-center justify-center text-sm text-slate-400">Tiada rekod</div>;
  const cx = 140, cy = 128, R = 104, r = 62;
  let a0 = -Math.PI / 2;
  const paths = rows.map((row, i) => {
    const a1 = a0 + (row.jumlah / total) * Math.PI * 2;
    const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    const xi1 = cx + r * Math.cos(a1), yi1 = cy + r * Math.sin(a1);
    const xi0 = cx + r * Math.cos(a0), yi0 = cy + r * Math.sin(a0);
    const lg = (a1 - a0) > Math.PI ? 1 : 0;
    const d = `M${x0} ${y0} A${R} ${R} 0 ${lg} 1 ${x1} ${y1} L${xi1} ${yi1} A${r} ${r} 0 ${lg} 0 ${xi0} ${yi0} Z`;
    a0 = a1;
    return <path key={i} d={d} fill={PAL[i % PAL.length]} stroke="#fff" strokeWidth={2} />;
  });
  return (
    <svg viewBox="0 0 280 256" style={{ width: "100%", height: "auto" }}>
      {paths}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={11} fill="#9a9a9a">Jumlah</text>
      <text x={cx} y={cy + 17} textAnchor="middle" fontSize={17} fontWeight={700} fill="#333">{rm(total)}</text>
    </svg>
  );
}

function Legend({ rows }: { rows: Baris[] }) {
  const total = rows.reduce((s, r) => s + r.jumlah, 0) || 1;
  return (
    <div className="mt-3 flex flex-col gap-1.5 text-xs">
      {rows.map((row, i) => (
        <span key={i} className="flex items-center gap-2 text-slate-600">
          <i style={{ width: 11, height: 11, borderRadius: 3, background: PAL[i % PAL.length], flex: "0 0 auto", display: "inline-block" }} />
          <span className="truncate">{row.nama}</span>
          <b className="ml-auto whitespace-nowrap text-slate-800">{rm(row.jumlah)} &middot; {Math.round(row.jumlah / total * 100)}%</b>
        </span>
      ))}
    </div>
  );
}

function Bar({ masuk, keluar, hingga }: { masuk: number[]; keluar: number[]; hingga: number }) {
  const W = 860, H = 340, padL = 54, padR = 16, padT = 16, padB = 40;
  const bulan = Array.from({ length: hingga + 1 }, (_, i) => i);
  const maxVal = Math.max(1, ...bulan.map((m) => Math.max(masuk[m], keluar[m]))) * 1.15;
  const iw = W - padL - padR, ih = H - padT - padB, gw = iw / bulan.length;
  const rmk = (v: number) => (v >= 1000 ? (v / 1000).toFixed(0) + "k" : String(Math.round(v)));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      <text x={padL - 40} y={padT - 2} fontSize={10} fill="#aaa">RM</text>
      {[0, 1, 2, 3, 4].map((t) => {
        const y = padT + ih - ih * t / 4;
        return (
          <g key={t}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#eee" />
            <text x={padL - 8} y={y + 3} textAnchor="end" fontSize={10} fill="#aaa">{rmk(maxVal * t / 4)}</text>
          </g>
        );
      })}
      {bulan.map((m) => {
        const bw = gw * 0.3, x = padL + m * gw + gw * 0.5;
        const hm = ih * (masuk[m] / maxVal), hk = ih * (keluar[m] / maxVal);
        return (
          <g key={m}>
            <rect x={x - bw - 2} y={padT + ih - hm} width={bw} height={hm} rx={3} fill={HIJAU} />
            <rect x={x + 2} y={padT + ih - hk} width={bw} height={hk} rx={3} fill={OREN} />
            <text x={x} y={H - padB + 16} textAnchor="middle" fontSize={10.5} fill="#777">{BULAN_PENDEK[m]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Tile({ label, value, jenis }: { label: string; value: string; jenis: "masuk" | "keluar" | "baki" }) {
  const bg = jenis === "masuk" ? "#e7f6ef" : jenis === "keluar" ? "#fdeee5" : "#eef4fd";
  const fg = jenis === "masuk" ? "#146c4e" : jenis === "keluar" ? "#b04117" : "#1c5cab";
  return (
    <div className="rounded-xl p-3.5" style={{ background: bg, color: fg }}>
      <div className="text-[11px] font-bold uppercase tracking-wide opacity-90">{label}</div>
      <div className="mt-0.5 text-xl font-extrabold">{value}</div>
    </div>
  );
}

export default function KewanganCarta({ tahun, nama, bulanAda, dataBulan, tahunMasuk, tahunKeluar, pratonton }: Props) {
  const [sel, setSel] = useState<string>("tahun");

  const jum = (a: number[]) => a.reduce((s, v) => s + v, 0);
  const isTahun = sel === "tahun";
  const idx = Number(sel);
  const d = dataBulan[idx];
  const totalM = d ? d.masuk.reduce((s, r) => s + r.jumlah, 0) : 0;
  const totalK = d ? d.keluar.reduce((s, r) => s + r.jumlah, 0) : 0;
  const hingga = Math.max(...bulanAda, 0);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      {/* Kepala */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Kewangan Surau &mdash; {tahun}</h1>
          <p className="mt-0.5 text-xs text-slate-500">{nama}</p>
        </div>
        <label className="text-sm">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-amber-700/80">Pilih paparan</span>
          <select
            value={sel}
            onChange={(e) => setSel(e.target.value)}
            className="min-w-[190px] rounded-lg border-[1.5px] border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900 focus:border-surau focus:outline-none"
          >
            <option value="tahun">Keseluruhan {tahun}</option>
            {bulanAda.map((m) => (
              <option key={m} value={String(m)}>{BULAN_PENUH[m]} {tahun}</option>
            ))}
          </select>
        </label>
      </div>

      {pratonton && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Pratonton (staf) &mdash; laporan ini belum diterbitkan kepada umum.
        </div>
      )}

      {isTahun ? (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Tile label={`Jumlah Pendapatan ${tahun}`} value={rm(jum(tahunMasuk))} jenis="masuk" />
            <Tile label={`Jumlah Perbelanjaan ${tahun}`} value={rm(jum(tahunKeluar))} jenis="keluar" />
            <Tile label={`Baki Bersih ${tahun}`} value={rm(jum(tahunMasuk) - jum(tahunKeluar))} jenis="baki" />
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Pendapatan vs Perbelanjaan ikut Bulan</h3>
            <p className="mb-1 text-[11.5px] text-slate-500">Januari hingga {BULAN_PENUH[hingga]} {tahun}</p>
            <Bar masuk={tahunMasuk} keluar={tahunKeluar} hingga={hingga} />
            <div className="mt-2 flex justify-center gap-5 text-xs text-slate-600">
              <span className="flex items-center gap-1.5"><i style={{ width: 11, height: 11, borderRadius: 3, background: HIJAU, display: "inline-block" }} /> Pendapatan</span>
              <span className="flex items-center gap-1.5"><i style={{ width: 11, height: 11, borderRadius: 3, background: OREN, display: "inline-block" }} /> Perbelanjaan</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Tile label="Pendapatan" value={rm(totalM)} jenis="masuk" />
            <Tile label="Perbelanjaan" value={rm(totalK)} jenis="keluar" />
            <Tile label="Baki Bulan" value={rm(totalM - totalK)} jenis="baki" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Pendapatan</h3>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">ikut Tabung</span>
              </div>
              <p className="mb-1 text-[11.5px] text-slate-500">Kutipan {BULAN_PENUH[idx]} {tahun}</p>
              <Donut rows={d ? d.masuk : []} />
              <Legend rows={d ? d.masuk : []} />
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Perbelanjaan</h3>
                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-orange-700">ikut Kategori</span>
              </div>
              <p className="mb-1 text-[11.5px] text-slate-500">Perbelanjaan {BULAN_PENUH[idx]} {tahun}</p>
              <Donut rows={d ? d.keluar : []} />
              <Legend rows={d ? d.keluar : []} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
