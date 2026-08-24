import { PAKEJ_PENAJA } from "@/lib/tetapan";

export type PakejPenaja = (typeof PAKEJ_PENAJA)[number];

export function cariPakej(kod: string): PakejPenaja | undefined {
  return PAKEJ_PENAJA.find((p) => p.kod === kod);
}

// Tempoh sebenar (bulan) — pakej tahunan (direktori) dikunci 12 bulan.
export function tempohBulan(kod: string, bulanDipilih: number): number {
  const p = cariPakej(kod);
  if (!p) return 0;
  return p.jenis === "tahunan" ? 12 : bulanDipilih;
}

// Harga keseluruhan (RM) untuk pakej + tempoh.
export function hargaPenaja(kod: string, bulanDipilih: number): number {
  const p = cariPakej(kod);
  if (!p) return 0;
  if (p.jenis === "tahunan") return (p as any).harga_tahun;
  return (p as any).harga_bulan * (bulanDipilih || 0);
}

// Tambah N bulan pada tarikh (YYYY-MM-DD).
export function tambahBulan(dari: Date, bulan: number): string {
  const d = new Date(dari.getTime());
  d.setMonth(d.getMonth() + bulan);
  return d.toISOString().slice(0, 10);
}
