// Tetapan lalai surau — ditulis siap supaya berfungsi walaupun env belum diset.
export const NAMA_SURAU =
  process.env.NEXT_PUBLIC_NAMA_SURAU ?? "Surau Ar Raudhah, Eco Majestic Semenyih";
export const NEGERI = "Negeri Selangor";
export const ZON_SOLAT = process.env.NEXT_PUBLIC_ZON_SOLAT ?? "SGR01";

// Langganan/sertai khairat dibuka? Set false untuk "hold" bahagian sertai khairat
// (butang Sertai Skim Khairat & pilihan sertai di borang) — pendaftaran tanggungan kekal.
export const KHAIRAT_DIBUKA = false;

// Senarai penuh gelaran/pangkat untuk borang
export const GELARAN = [
  // Umum
  "Encik",
  "Puan",
  "Cik",
  "Tuan",
  "Saudara",
  "Saudari",
  // Agama
  "Tuan Haji",
  "Hajah",
  "Ustaz",
  "Ustazah",
  "Syed",
  "Sharifah",
  // Profesional
  "Dr.",
  "Prof.",
  "Prof. Madya",
  "Ir.",
  "Ar.",
  "Ts.",
  "Sr.",
  // Keturunan / kerabat
  "Wan",
  "Nik",
  "Megat",
  "Tengku",
  "Tunku",
  "Raja",
  // Gelaran kurniaan
  "Datuk",
  "Dato'",
  "Datin",
  "Datuk Wira",
  "Dato' Wira",
  "Datuk Seri",
  "Dato' Sri",
  "Datin Seri",
  "Datin Paduka",
  "Tan Sri",
  "Puan Sri",
  "Tun",
  "Toh Puan",
  "Yang Berhormat (YB)",
];

export const LOGO_JAIS = "/logo-jais.png";
export const LOGO_SELANGOR = "/logo-selangor.png";
export const LOGO_SURAU = "/logo-surau-2.png"; // mendatar (header)
export const LOGO_SURAU_TEGAK = "/logo-surau-1.png"; // menegak (cetak/hero)
