// Jenis dokumen staf untuk Modul Dokumen Staf (Fasa 55).
export const JENIS_DOKUMEN: { kod: string; label: string }[] = [
  { kod: "tawaran", label: "Surat Tawaran Kerja" },
  { kod: "aku_janji", label: "Surat Aku Janji" },
  { kod: "kontrak", label: "Kontrak / Perjanjian" },
  { kod: "wi", label: "Work Instruction (WI)" },
  { kod: "penilaian", label: "Borang Penilaian Prestasi" },
  { kod: "slip_gaji", label: "Slip Gaji" },
  { kod: "ic", label: "Salinan Kad Pengenalan" },
  { kod: "lesen", label: "Lesen Memandu" },
  { kod: "sijil", label: "Sijil / Kelayakan" },
  { kod: "gambar", label: "Gambar Passport" },
  { kod: "lain", label: "Lain-lain" },
];

export function labelJenisDok(kod?: string | null): string {
  return JENIS_DOKUMEN.find((j) => j.kod === kod)?.label ?? (kod ?? "Lain-lain");
}

// Warna chip ikut jenis (Tailwind).
export function clsJenisDok(kod?: string | null): string {
  switch (kod) {
    case "tawaran":
    case "aku_janji":
    case "kontrak":
      return "bg-indigo-100 text-indigo-700";
    case "wi":
      return "bg-amber-100 text-amber-700";
    case "penilaian":
      return "bg-green-100 text-green-700";
    case "slip_gaji":
      return "bg-emerald-100 text-emerald-700";
    case "ic":
    case "lesen":
    case "gambar":
      return "bg-slate-100 text-slate-600";
    case "sijil":
      return "bg-sky-100 text-sky-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}
