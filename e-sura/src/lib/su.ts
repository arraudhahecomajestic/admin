// Konstan untuk Panel Setiausaha
export const JENIS_MESYUARAT = ["AJK", "Agung", "Khas", "Jawatankuasa Kecil"];
export const STATUS_MESYUARAT = ["draf", "selesai"];
export const STATUS_TINDAKAN = [
  { kod: "baru", label: "Baru" },
  { kod: "dalam_tindakan", label: "Dalam Tindakan" },
  { kod: "selesai", label: "Selesai" },
];
export const STATUS_SURAT = [
  { kod: "draf", label: "Draf" },
  { kod: "dihantar", label: "Dihantar" },
  { kod: "diterima", label: "Diterima" },
  { kod: "diarkib", label: "Diarkib" },
];

// Cadangan no. rujukan surat keluar: SAR/<tahun>/<bulan>/<turutan>
export function cadangRujukan(bilTahunIni: number, tahun: number): string {
  const turutan = String(bilTahunIni + 1).padStart(3, "0");
  return `SAR/${tahun}/${turutan}`;
}

export function labelStatusTindakan(kod?: string | null): string {
  return STATUS_TINDAKAN.find((s) => s.kod === kod)?.label ?? (kod ?? "-");
}
export function labelStatusSurat(kod?: string | null): string {
  return STATUS_SURAT.find((s) => s.kod === kod)?.label ?? (kod ?? "-");
}
