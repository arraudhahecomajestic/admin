import { PAKEJ_PENAJA, TEMPOH_PENAJA } from "@/lib/tetapan";

export type PakejPenaja = (typeof PAKEJ_PENAJA)[number];

export function cariPakej(kod: string): PakejPenaja | undefined {
  return PAKEJ_PENAJA.find((p) => p.kod === kod);
}

export function tempohSah(bulan: number): boolean {
  return (TEMPOH_PENAJA as readonly number[]).includes(bulan);
}

// Harga keseluruhan (RM) = harga sebulan × tempoh (bulan).
export function hargaPenaja(kod: string, bulan: number): number {
  const p = cariPakej(kod);
  if (!p) return 0;
  return p.harga_bulan * (bulan || 0);
}

// Tambah N bulan pada tarikh, pulang YYYY-MM-DD.
export function tambahBulan(dari: Date, bulan: number): string {
  const d = new Date(dari.getTime());
  d.setMonth(d.getMonth() + bulan);
  return d.toISOString().slice(0, 10);
}
