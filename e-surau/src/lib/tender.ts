// Konstan & helper untuk modul Tender / Iklan.
export const KATEGORI_TENDER = [
  "Pembinaan & Naik Taraf",
  "Penyelenggaraan",
  "Pembekalan Barang",
  "Perkhidmatan",
  "Kebersihan",
  "Katering & Jamuan",
  "Percetakan & Media",
  "Lain-lain",
];

export const STATUS_TENDER = [
  { kod: "aktif", label: "Aktif" },
  { kod: "tutup", label: "Tutup" },
  { kod: "batal", label: "Batal" },
];

export function labelStatusTender(kod?: string | null): string {
  return STATUS_TENDER.find((s) => s.kod === kod)?.label ?? (kod ?? "-");
}

// Tender dikira TUTUP jika status bukan 'aktif' ATAU tarikh tutup telah lepas.
export function tenderTutup(t: { status?: string | null; tarikh_tutup?: string | null }, hariIni: string): boolean {
  if (t.status && t.status !== "aktif") return true;
  if (t.tarikh_tutup && String(t.tarikh_tutup) < hariIni) return true;
  return false;
}

export function clsStatusTender(tutup: boolean): string {
  return tutup ? "bg-slate-100 text-slate-500" : "bg-green-100 text-green-700";
}

export function hariIniMY(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
}
