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

export function namaPakej(kod: string): string {
  return cariPakej(kod)?.nama ?? kod;
}

// Matriks faedah setiap pakej (untuk jadual perbandingan di /rakan/sertai).
// nilai: true = ✓, false = —, string = teks (cth "1×/bln").
export const FAEDAH_PENAJA: { label: string; nilai: Record<string, boolean | string> }[] = [
  { label: "Tersenarai dalam Direktori Rakan Surau", nilai: { direktori: true, gangsa: true, perak: true, emas: true } },
  { label: "Pautan ke laman / WhatsApp perniagaan", nilai: { direktori: true, gangsa: true, perak: true, emas: true } },
  { label: "Logo dipaparkan (bukan teks sahaja)", nilai: { direktori: false, gangsa: true, perak: true, emas: true } },
  { label: "Ruang tawaran / promo eksklusif ahli kariah", nilai: { direktori: false, gangsa: true, perak: true, emas: true } },
  { label: "Logo dipapar di laman utama portal", nilai: { direktori: false, gangsa: true, perak: true, emas: true } },
  { label: "Logo besar + keutamaan paling atas", nilai: { direktori: false, gangsa: false, perak: false, emas: true } },
  { label: "Sebutan di media sosial surau", nilai: { direktori: false, gangsa: false, perak: "1×/bln", emas: "2×/bln" } },
  { label: "Sebutan semasa program / majlis surau", nilai: { direktori: false, gangsa: false, perak: false, emas: true } },
];
