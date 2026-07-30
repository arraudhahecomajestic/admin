// Logik untuk modul Yaasin & Tahlil (senarai arwah).

// Kesan jantina dari nama: "binti/bt/bte" = perempuan, "bin/ibn" = lelaki.
export function jantinaDariNama(nama: string): "lelaki" | "perempuan" | "tidak_pasti" {
  const t = (nama || "").toLowerCase().replace(/[.,'"]/g, " ").split(/\s+/).filter(Boolean);
  if (t.includes("binti") || t.includes("bt") || t.includes("bte") || t.includes("bint")) return "perempuan";
  if (t.includes("bin") || t.includes("ibn") || t.includes("b")) return "lelaki";
  return "tidak_pasti";
}

// Waktu Malaysia (UTC+8) & waktu tutup pendaftaran tahlil.
const MYT_OFFSET_MS = 8 * 60 * 60 * 1000;
export const TUTUP_JAM = 19;  // 7:00 malam — waktu TUTUP pendaftaran nama
export const PAPAR_JAM = 20;  // 8:00 malam — senarai kekal DIPAPAR sehingga lepas majlis

// Date yang medan UTC-nya mewakili "jam dinding" Malaysia — supaya betul
// walaupun pelayan (Cloudflare) berjalan dalam UTC.
function mytSekarang(): Date {
  return new Date(Date.now() + MYT_OFFSET_MS);
}

// Kira tarikh Khamis (malam Jumaat) sasaran ikut jam tutup tertentu.
function khamisDenganTutup(jamTutup: number): string {
  const m = mytSekarang();
  const dow = m.getUTCDay(); // 0=Ahad .. 4=Khamis .. 6=Sabtu
  const jam = m.getUTCHours();
  let add = (4 - dow + 7) % 7; // bilangan hari ke Khamis
  // Hari ini Khamis tetapi sudah cecah/lepas jam tutup → tolak ke Khamis depan.
  if (add === 0 && jam >= jamTutup) add = 7;
  const t = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), m.getUTCDate() + add));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

// Khamis sasaran untuk PENDAFTARAN nama — tutup 7:00 malam Khamis.
export function khamisAkan(): string {
  return khamisDenganTutup(TUTUP_JAM);
}

// Khamis untuk PAPARAN senarai — kekal sehingga 8:00 malam Khamis supaya
// imam bertugas boleh baca nama malam itu tanpa perlu buka panel admin.
export function khamisPapar(): string {
  return khamisDenganTutup(PAPAR_JAM);
}

export function gelaranArwah(jantina: string): string {
  if (jantina === "lelaki") return "Al-Marhum";
  if (jantina === "perempuan") return "Al-Marhumah";
  return "Arwah";
}
