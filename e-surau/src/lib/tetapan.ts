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
export const NO_PENDAFTARAN = "JAIS.BPM.600-5/13/465"; // No. pendaftaran JAIS (dipapar utk gerbang bayaran CHIP)
export const WEB_SURAU = "https://ar-raudhah.mimbar.my/";
export const CARA_BAYAR_BELANJA = ["Pindahan Atas Talian", "Tunai", "Cek"];

// Papar bahagian Penaja di laman utama? false = urus di admin sahaja (belum dilancarkan).
export const PENAJA_DIPAPAR = false;

// Khairat: yuran & pakej pelbagai tahun (dibeli terus via CHIP)
export const YURAN_KHAIRAT_TAHUNAN = 60;
export const PAMPASAN_KHAIRAT = 1200; // pampasan tetap setiap kematian dilindungi
export const PAKEJ_KHAIRAT = [
  { tahun: 1, label: "1 Tahun" },
  { tahun: 3, label: "3 Tahun" },
  { tahun: 5, label: "5 Tahun" },
  { tahun: 10, label: "10 Tahun" },
];

// Pakej Penajaan / Rakan Surau — bayar upfront via CHIP, logo auto-papar ikut tempoh.
// jenis "bulanan": harga = harga_bulan × tempoh (pilih 3/6/9/12 bulan)
// jenis "tahunan": harga tetap setahun (tempoh dikunci 12 bulan)
export const PAKEJ_PENAJA = [
  { kod: "emas",      nama: "Emas",                  jenis: "bulanan", harga_bulan: 1000, huraian: "Logo besar di laman utama + direktori + keutamaan susunan." },
  { kod: "perak",     nama: "Perak",                 jenis: "bulanan", harga_bulan: 500,  huraian: "Logo sederhana di laman utama + direktori." },
  { kod: "gangsa",    nama: "Gangsa",                jenis: "bulanan", harga_bulan: 200,  huraian: "Logo di direktori Rakan Surau." },
  { kod: "direktori", nama: "Direktori Rakan Surau", jenis: "bulanan", harga_bulan: 20,   huraian: "Tersenarai dalam direktori Rakan Surau." },
] as const;
export const TEMPOH_PENAJA = [3, 6, 9, 12] as const; // pilihan bulan untuk pakej bulanan

// Pakej Infaq (langganan/satu-tap) — halaman /infaq
export const PAKEJ_INFAQ_SUBUH = [2, 5, 7, 10, 15, 20, 50]; // RM tiap infaq subuh
export const INFAQ_JAMUAN_SELOT = 10;   // RM satu lot jamuan Yassin & Tahlil
export const INFAQ_JAMUAN_MAX_LOT = 35; // 35 lot × RM10 = RM350 belanja jamuan/malam Jumaat

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
