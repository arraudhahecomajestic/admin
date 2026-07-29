// Pengkelasan ahli kariah ikut jalan / fasa (Eco Majestic).
// Nombor selepas "ECO MAJESTIC" dalam alamat = nombor jalan → nama fasa.

export type Kawasan = { kod: string; nama: string; jalan?: number };

export const KAWASAN: Kawasan[] = [
  { kod: "cradleton", nama: "Cradleton", jalan: 1 },
  { kod: "tenderfield", nama: "Tenderfield", jalan: 2 },
  { kod: "stoneridge", nama: "Stoneridge", jalan: 6 },
  { kod: "mellowood", nama: "Mellowood", jalan: 7 },
  { kod: "merrydale", nama: "Merrydale", jalan: 8 },
  { kod: "cheerywood", nama: "Cheerywood", jalan: 9 },
  { kod: "karisma", nama: "Karisma Apartment" },
  { kod: "harmoni", nama: "Harmoni Apartment" },
  { kod: "simfoni", nama: "Simfoni Apartment" },
];

export const KAWASAN_LAIN: Kawasan = { kod: "lain", nama: "Lain-lain / Luar Fasa" };

// Kenal pasti kawasan seorang ahli. Utamakan medan `kawasan` (dropdown), jika
// kosong baru auto-kesan dari teks alamat.
export function kenalKawasan(alamat?: string | null, kawasanKod?: string | null): Kawasan {
  if (kawasanKod) {
    const pilih = KAWASAN.find((k) => k.kod === kawasanKod);
    if (pilih) return pilih;
    if (kawasanKod === "lain") return KAWASAN_LAIN;
  }
  const a = (alamat || "").toUpperCase();
  if (!a.trim()) return KAWASAN_LAIN;

  // Apartment ikut nama
  if (a.includes("KARISMA")) return KAWASAN.find((k) => k.kod === "karisma")!;
  if (a.includes("HARMONI")) return KAWASAN.find((k) => k.kod === "harmoni")!;
  if (a.includes("SIMFONI")) return KAWASAN.find((k) => k.kod === "simfoni")!;

  // Jalan: nombor selepas "ECO MAJESTIC" (cth "JALAN ECO MAJESTIC 8/3")
  const m = a.match(/ECO\s*MAJESTIC\s*(\d+)/);
  if (m) {
    const no = parseInt(m[1], 10);
    const pilih = KAWASAN.find((k) => k.jalan === no);
    if (pilih) return pilih;
  }
  return KAWASAN_LAIN;
}

// Untuk dropdown borang (termasuk pilihan "Lain-lain").
export const KAWASAN_PILIHAN: Kawasan[] = [...KAWASAN, KAWASAN_LAIN];
