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

// Maklumat rasmi surau untuk baucer/resit
export const ALAMAT_SURAU = "Jalan Eco Majestic 2/5, Eco Majestic, 43500 Semenyih, Selangor Darul Ehsan";
export const EMEL_SURAU = "arraudhah.ecomajestic@gmail.com";
export const WEB_SURAU = "https://ar-raudhah.mimbar.my/";
export const CARA_BAYAR_BELANJA = ["Pindahan Atas Talian", "Tunai", "Cek"];

export const SENARAI_BANK = [
  "Maybank", "CIMB Bank", "Bank Islam", "RHB Bank", "Public Bank",
  "Bank Simpanan Nasional (BSN)", "Bank Rakyat", "AmBank", "Hong Leong Bank",
  "Affin Bank", "Bank Muamalat", "OCBC Bank", "HSBC", "UOB", "Standard Chartered",
  "Alliance Bank", "MBSB Bank", "Agrobank", "Al-Rajhi Bank", "Lain-lain",
];

export const LOGO_JAIS = "/logo-jais.png";
export const LOGO_SELANGOR = "/logo-selangor.png";
export const LOGO_SURAU = "/logo-surau-2.png"; // mendatar (header)
export const LOGO_SURAU_TEGAK = "/logo-surau-1.png"; // menegak (cetak/hero)
