// Logik untuk modul Yaasin & Tahlil (senarai arwah).

// Kesan jantina dari nama: "binti/bt/bte" = perempuan, "bin/ibn" = lelaki.
export function jantinaDariNama(nama: string): "lelaki" | "perempuan" | "tidak_pasti" {
  const t = (nama || "").toLowerCase().replace(/[.,'"]/g, " ").split(/\s+/).filter(Boolean);
  if (t.includes("binti") || t.includes("bt") || t.includes("bte") || t.includes("bint")) return "perempuan";
  if (t.includes("bin") || t.includes("ibn") || t.includes("b")) return "lelaki";
  return "tidak_pasti";
}

// Tarikh Khamis (malam Jumaat) yang akan datang / hari ini, format YYYY-MM-DD.
export function khamisAkan(): string {
  const d = new Date();
  const add = (4 - d.getDay() + 7) % 7; // 4 = Khamis
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate() + add);
  return `${r.getFullYear()}-${String(r.getMonth() + 1).padStart(2, "0")}-${String(r.getDate()).padStart(2, "0")}`;
}

export function gelaranArwah(jantina: string): string {
  if (jantina === "lelaki") return "Al-Marhum";
  if (jantina === "perempuan") return "Al-Marhumah";
  return "Arwah";
}
