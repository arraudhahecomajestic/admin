import Link from "next/link";
import { rm } from "@/lib/format";

type Baris = { nama: string; jumlah: number };
type Props = {
  tahun: number;
  bulan: number; // 0-11
  masuk: Baris[];
  keluar: Baris[];
  pratonton?: boolean;
};

const BULAN_PENUH = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
const PAL = ["#2563a8", "#c26b32", "#2e8b6b", "#c9a227", "#8a5a9e", "#5f7280", "#6f9a3a", "#b0483a", "#3f7d9a", "#a06a3a", "#6b7f2a", "#94566b"];

function Donut({ rows, warna }: { rows: Baris[]; warna: string }) {
  const total = rows.reduce((s, r) => s + r.jumlah, 0);
  if (!total) return <div className="flex h-[190px] items-center justify-center text-sm text-slate-400">Tiada rekod</div>;
  const cx = 120, cy = 110, R = 90, r = 54;
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
    <svg viewBox="0 0 240 220" style={{ width: "100%", height: "auto" }}>
      {paths}
      <text x={cx} y={cy - 3} textAnchor="middle" fontSize={10} fill="#9a9a9a">Jumlah</text>
      <text x={cx} y={cy + 15} textAnchor="middle" fontSize={15} fontWeight={700} fill={warna}>{rm(total)}</text>
    </svg>
  );
}

function Legend({ rows }: { rows: Baris[] }) {
  const total = rows.reduce((s, r) => s + r.jumlah, 0) || 1;
  const atas = rows.slice(0, 3);
  const baki = rows.length - atas.length;
  return (
    <div className="mt-2 flex flex-col gap-1 text-[11.5px]">
      {atas.map((row, i) => (
        <span key={i} className="flex items-center gap-2 text-slate-600">
          <i style={{ width: 10, height: 10, borderRadius: 3, background: PAL[i % PAL.length], flex: "0 0 auto", display: "inline-block" }} />
          <span className="truncate">{row.nama}</span>
          <b className="ml-auto whitespace-nowrap text-slate-800">{rm(row.jumlah)} &middot; {Math.round(row.jumlah / total * 100)}%</b>
        </span>
      ))}
      {baki > 0 && <span className="pl-4 text-[11px] text-slate-400">+ {baki} lagi kategori</span>}
    </div>
  );
}

export default function KewanganRingkasHome({ tahun, bulan, masuk, keluar, pratonton }: Props) {
  const totalM = masuk.reduce((s, r) => s + r.jumlah, 0);
  const totalK = keluar.reduce((s, r) => s + r.jumlah, 0);
  const baki = totalM - totalK;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Kewangan Surau &mdash; {BULAN_PENUH[bulan]} {tahun}</h2>
          <p className="mt-0.5 text-xs text-slate-500">Ringkasan kutipan &amp; perbelanjaan bulan terkini</p>
        </div>
        <Link href="/kewangan" className="whitespace-nowrap rounded-lg bg-surau px-3 py-1.5 text-sm font-semibold text-white hover:bg-surau-dark">
          Bulan lain &amp; keseluruhan &rarr;
        </Link>
      </div>

      {pratonton && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Pratonton (staf) &mdash; laporan ini belum diterbitkan kepada umum.
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl p-3.5" style={{ background: "#e7f6ef", color: "#146c4e" }}>
          <div className="text-[11px] font-bold uppercase tracking-wide opacity-90">Pendapatan</div>
          <div className="mt-0.5 text-xl font-extrabold">{rm(totalM)}</div>
        </div>
        <div className="rounded-xl p-3.5" style={{ background: "#fdeee5", color: "#b04117" }}>
          <div className="text-[11px] font-bold uppercase tracking-wide opacity-90">Perbelanjaan</div>
          <div className="mt-0.5 text-xl font-extrabold">{rm(totalK)}</div>
        </div>
        <div className="rounded-xl p-3.5" style={{ background: "#eef4fd", color: "#1c5cab" }}>
          <div className="text-[11px] font-bold uppercase tracking-wide opacity-90">Baki Bulan</div>
          <div className="mt-0.5 text-xl font-extrabold">{rm(baki)}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Pendapatan</h3>
          <p className="mb-1 text-[11.5px] text-slate-500">Kutipan {BULAN_PENUH[bulan]} {tahun}</p>
          <Donut rows={masuk} warna="#146c4e" />
          <Legend rows={masuk} />
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Perbelanjaan</h3>
          <p className="mb-1 text-[11.5px] text-slate-500">Perbelanjaan {BULAN_PENUH[bulan]} {tahun}</p>
          <Donut rows={keluar} warna="#b04117" />
          <Legend rows={keluar} />
        </div>
      </div>

      <Link href="/kewangan" className="mt-4 block rounded-lg bg-slate-50 py-2.5 text-center text-sm font-semibold text-surau hover:bg-slate-100">
        Lihat kewangan penuh &mdash; bulan lain &amp; keseluruhan {tahun} &rarr;
      </Link>
    </section>
  );
}
