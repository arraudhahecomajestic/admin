// Tetapan lalai surau — ditulis siap supaya berfungsi walaupun env belum diset.
export const NAMA_SURAU =
  process.env.NEXT_PUBLIC_NAMA_SURAU ?? "Surau Ar Raudhah, Eco Majestic Semenyih";
export const NEGERI = "Negeri Selangor";
export const ZON_SOLAT = process.env.NEXT_PUBLIC_ZON_SOLAT ?? "SGR01";

// Langganan/sertai khairat dibuka? Set false untuk "hold" bahagian sertai khairat
// (butang Sertai Skim Khairat & pilihan sertai di borang) — pendaftaran tanggungan kekal.
export const KHAIRAT_DIBUKA = false;

// Senarai gelaran ringkas untuk borang
export const GELARAN = [
  "Encik",
  "Puan",
  "Cik",
  "Tuan Haji",
  "Hajah",
  "Dr.",
  "Dato'",
  "Datin",
  "Datuk",
  "Dato' Sri",
  "Datin Sri",
  "Tan Sri",
  "Tun",
];

// Akaun bank surau untuk sumbangan (kemas kini dengan butiran sebenar)
export const BANK_SURAU = {
  bank: "Maybank",
  no_akaun: "562526530675",
  nama_akaun: "Surau Ar-Raudhah Eco Majestic",
};

export const LOGO_JAIS = "/logo-jais.png";
export const LOGO_SELANGOR = "/logo-selangor.png";
export const LOGO_SURAU = "/logo-surau-2.png"; // mendatar (header)
export const LOGO_SURAU_TEGAK = "/logo-surau-1.png"; // menegak (cetak/hero)
