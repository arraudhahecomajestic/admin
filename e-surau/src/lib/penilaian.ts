// Definisi KPI penilaian prestasi staf (ikut Surat Tawaran SAR-500-3/1/2, seksyen 1.5).
// Digunakan oleh borang penilaian & pengiraan markah berwajaran.

export type KriteriaItem = { no: number; tajuk: string; indikator: string; max: number };
export type Bahagian = { kod: string; tajuk: string; wajaran: number; items: KriteriaItem[] };

export const BAHAGIAN_PENILAIAN: Bahagian[] = [
  { kod: "A", tajuk: "Kebersihan & Kekemasan", wajaran: 0.30, items: [
    { no: 1, tajuk: "Kebersihan Ruang Solat", indikator: "Lantai, karpet, sejadah & dinding sentiasa bersih, wangi & tersusun setiap shift.", max: 25 },
    { no: 2, tajuk: "Kebersihan Bilik Air & Wuduk", indikator: "Bilik air & tempat wuduk dibersihkan mengikut SOP setiap shift. Tiada bau, tiada air bertakung.", max: 25 },
    { no: 3, tajuk: "Kekemasan Peralatan Surau", indikator: "Peralatan (sejadah, telekung, Al-Quran, alat pembersih) tersusun kemas & mudah dicapai.", max: 25 },
    { no: 4, tajuk: "Kebersihan Kawasan Luar", indikator: "Kawasan luar surau, pintu masuk & tangga sentiasa bersih & bebas sampah.", max: 25 },
  ] },
  { kod: "B", tajuk: "Ketepatan Masa", wajaran: 0.20, items: [
    { no: 5, tajuk: "Kehadiran Tepat Masa", indikator: "Tiba sebelum shift bermula. Tiada rekod lewat tanpa sebab (lewat >15 min = tolak RM10).", max: 25 },
    { no: 6, tajuk: "Azan & Iqamah On-Time", indikator: "Azan & iqamah tepat pada waktunya bila ditugaskan. Tiada tangguh atau tertinggal.", max: 25 },
    { no: 7, tajuk: "Penyiapan Tugas Mengikut Jadual", indikator: "Semua tugas harian selesai dalam tempoh shift tanpa perlu ditegur.", max: 25 },
    { no: 8, tajuk: "Pengurusan Cuti & Laporan Ketidakhadiran", indikator: "Permohonan cuti awal (min 1 minggu). Cuti sakit lapor sebelum 6 AM dengan MC.", max: 25 },
  ] },
  { kod: "C", tajuk: "Sikap & Adab", wajaran: 0.20, items: [
    { no: 9, tajuk: "Layanan kepada Jemaah", indikator: "Peramah, memberi salam & membantu jemaah dengan ikhlas. Tiada aduan sikap kasar.", max: 34 },
    { no: 10, tajuk: "Pematuhan Arahan AJK", indikator: "Melaksanakan arahan AJK, Imam & Pengerusi tanpa soal selagi tidak bertentangan syarak.", max: 33 },
    { no: 11, tajuk: "Menjaga Nama Baik Surau", indikator: "Berpakaian kemas, berkelakuan baik dalam & luar waktu bertugas. Tiada insiden memalukan.", max: 33 },
  ] },
  { kod: "D", tajuk: "Pentadbiran & Rekod", wajaran: 0.30, items: [
    { no: 12, tajuk: "Kemaskini Sistem Digital", indikator: "Data kariah & e-khairat dikemaskini dalam sistem secara konsisten & tepat.", max: 25 },
    { no: 13, tajuk: "Laporan Harian", indikator: "Laporan harian dihantar kepada Setiausaha/Pengerusi setiap hari bertugas.", max: 25 },
    { no: 14, tajuk: "Laporan Program", indikator: "Laporan program (kuliah, Ramadan, majlis) lengkap, jelas & tepat masa.", max: 25 },
    { no: 15, tajuk: "Pengurusan Fail & Dokumen", indikator: "Fail, rekod kewangan (sedekah), inventori & dokumen diurus sistematik & teratur.", max: 25 },
  ] },
];

// Subtotal satu bahagian (0–100, sebab item dalam setiap bahagian berjumlah 100 markah).
export function subtotalBahagian(b: Bahagian, markah: Record<string, number>): number {
  return b.items.reduce((s, it) => s + (Number(markah[String(it.no)]) || 0), 0);
}

// Markah akhir berwajaran (0–100%).
export function markahAkhir(markah: Record<string, number>): number {
  const jum = BAHAGIAN_PENILAIAN.reduce((s, b) => s + subtotalBahagian(b, markah) * b.wajaran, 0);
  return Math.round(jum * 100) / 100;
}

export function gredDari(pct: number): { gred: string; cls: string; ganjaran: string } {
  if (pct >= 80) return { gred: "Cemerlang", cls: "bg-blue-100 text-blue-700", ganjaran: "Saguhati One-off + Sijil" };
  if (pct >= 60) return { gred: "Baik", cls: "bg-green-100 text-green-700", ganjaran: "Sijil Penghargaan" };
  if (pct >= 40) return { gred: "Sederhana", cls: "bg-amber-100 text-amber-700", ganjaran: "Amaran + Latihan Semula" };
  return { gred: "Lemah", cls: "bg-red-100 text-red-700", ganjaran: "Penamatan Kontrak" };
}

export const KEPUTUSAN_LABEL: Record<string, string> = {
  lulus: "Lulus — Sambung Kontrak",
  lanjut: "Lanjut Percubaan (+3 bulan)",
  tamat: "Tamat Perkhidmatan",
};
