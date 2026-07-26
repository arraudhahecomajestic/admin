// Modul Pembekal & Tuntutan Bayaran

export const JENIS_PEMBEKAL = ["Vendor", "Imam", "Bilal", "Supplier", "Lain-lain"];

// Status tuntutan → label & warna
export const STATUS_TUNTUTAN: Record<string, { label: string; warna: string }> = {
  baru: { label: "Menunggu Semakan AJK", warna: "bg-amber-100 text-amber-700" },
  disah_ajk: { label: "Disah AJK · Menunggu Bendahari", warna: "bg-blue-100 text-blue-700" },
  diluluskan: { label: "Diluluskan · Menunggu Bayaran", warna: "bg-indigo-100 text-indigo-700" },
  dibayar: { label: "Dibayar", warna: "bg-green-100 text-green-700" },
  ditolak: { label: "Ditolak", warna: "bg-red-100 text-red-700" },
};

export const STATUS_PEMBEKAL: Record<string, { label: string; warna: string }> = {
  menunggu: { label: "Menunggu Kelulusan", warna: "bg-amber-100 text-amber-700" },
  lulus: { label: "Diluluskan", warna: "bg-green-100 text-green-700" },
  tolak: { label: "Ditolak", warna: "bg-red-100 text-red-700" },
};
